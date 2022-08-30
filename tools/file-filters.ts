export const configFilter = './src/translations/_config.(yaml|yml)';
export const translationFilter = [
  './src/translations/*.(yaml|yml)',
  `!${configFilter}`,
];
export const bootswatchFilter = './node_modules/bootswatch/dist/**/bootstrap.css';
