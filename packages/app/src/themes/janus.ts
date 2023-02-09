import {BackstageTheme, createTheme, genPageTheme, lightTheme, shapes} from '@backstage/theme';

import { AutocompleteClassKey } from '@material-ui/lab/Autocomplete';
import { AlertClassKey } from '@material-ui/lab/Alert';

// Labs types not included in overrides; https://github.com/mui/material-ui/issues/19427
declare module '@material-ui/core/styles/overrides' {
    export interface ComponentNameToClassKey {
        MuiAlert: AlertClassKey;
        MuiAutocomplete: AutocompleteClassKey;
    }
}

const baseTheme = createTheme({
    palette: {
        ...lightTheme.palette,
        navigation: {
            background: '#222427',
            indicator: '#009596',
            color: '#ffffff',
            selectedColor: '#ffffff',
            navItem: {
                hoverBackground: '#4f5255',
            },
        },
    },
    defaultPageTheme: 'home',
    pageTheme: {
        home: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
        app: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
        apis: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
        documentation: genPageTheme({
            colors: ['#005f60', '#73c5c5'],
            shape: shapes.wave,
        }),
        tool: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.round }),
        other: genPageTheme({ colors: ['#005f60', '#73c5c5'], shape: shapes.wave }),
    },
});

export const janusTheme: BackstageTheme = {
    ...baseTheme,
    overrides: {
        ...baseTheme.overrides,
    },
};
