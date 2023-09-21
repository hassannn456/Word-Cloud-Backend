import * as shell from 'shelljs';

// shell.cp('-R', 'src/thai-data.json', 'dist/');
// shell.cp('-R', 'src/address_2c2p_data.json', 'dist/');
// shell.cp('-R', 'src/banks.json', 'dist/');
shell.cp('-R', 'src/graphql/typedefs/*.graphql', 'dist/graphql/typedefs');
// shell.cp('-R', 'src/graphql/*.graphql', 'dist/graphql');
