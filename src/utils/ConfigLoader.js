const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
require('dotenv').config();

class ConfigLoader {
  static #cache = {};

  static load(environment = 'dev') {
    if (this.#cache[environment]) {
      return this.#cache[environment];
    }

    const configPath = path.resolve(
      __dirname,
      `../../config/environments/${environment}.yaml`
    );

    if (!fs.existsSync(configPath)) {
      throw new Error(`Configuration file not found for environment: ${environment}`);
    }

    const rawYaml = fs.readFileSync(configPath, 'utf8');
    const interpolated = this.#interpolateEnvVars(rawYaml);
    const config = yaml.load(interpolated);

    this.#cache[environment] = config;
    return config;
  }

  static get(key, environment = process.env.ENVIRONMENT || 'dev') {
    const config = this.load(environment);
    return key.split('.').reduce((obj, k) => obj?.[k], config);
  }

  static #interpolateEnvVars(content) {
    return content.replace(/\$\{([^}]+)\}/g, (match, varName) => {
      const value = process.env[varName];
      if (!value) {
        console.warn(`[ConfigLoader] Environment variable ${varName} is not set`);
        return match;
      }
      return value;
    });
  }

  static clearCache() {
    this.#cache = {};
  }
}

module.exports = { ConfigLoader };
