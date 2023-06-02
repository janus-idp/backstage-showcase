module.exports = {
  ...require('@spotify/prettier-config'),
  importOrder: [
    '^react(.*)$',
    '',
    '^@backstage/(.*)$',
    '',
    '<THIRD_PARTY_MODULES>',
    '',
    '^@janus-idp/(.*)$',
    '',
    '<BUILTIN_MODULES>',
    '',
    '^[.]',
  ],
};
