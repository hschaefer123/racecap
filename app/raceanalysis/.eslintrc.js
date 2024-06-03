module.exports = {
    "extends": "plugin:@sap-ux/eslint-plugin-fiori-tools/defaultTS",
    "root": true,
    "parserOptions": {
        "project": [`${__dirname}/tsconfig.json`],
        "sourceType": "module"
    },
    "plugins": ["@typescript-eslint"],
    "ignorePatterns": [".eslintrc.js"]
}
