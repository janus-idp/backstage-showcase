import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import { styled } from '@mui/material/styles';
import InputBase from '@mui/material/InputBase';
import HelpOutlineOutlinedIcon from '@mui/icons-material/HelpOutlineRounded';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import { MenuButton } from '@mui/base/MenuButton';
import ArrowDropDownOutlinedIcon from '@mui/icons-material/ArrowDropDownOutlined';
import { Menu } from '@mui/base/Menu';
import { MenuItem } from '@mui/base/MenuItem';
import { Dropdown } from '@mui/base/Dropdown';
import CategoryOutlinedIcon from '@mui/icons-material/CategoryOutlined';
import ListItemIcon from '@mui/material/ListItemIcon';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import ManageAccountsOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import LogoutOutlinedIcon from '@mui/icons-material/LogoutOutlined';
import { Link } from '@backstage/core-components';
import SearchIcon from '@mui/icons-material/Search';
import Box from '@mui/material/Box';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';

const models = [
  {
    key: 1,
    value: 'argocd-template',
    label: 'Add ArgoCD to an existing project',
  },
  {
    key: 2,
    value: 'create-backend-plugin',
    label: 'Create Backend Plugin Template',
  },
  {
    key: 3,
    value: 'create-frontend-plugin',
    label: 'Create Frontend Plugin Template',
  },
  {
    key: 4,
    value: 'create-react-app-template-test-annotator',
    label: 'Create React App Template with annotations',
  },
  {
    key: 5,
    value: 'define-ansible-job-template',
    label: 'Ansible Job Template',
  }
]


interface MenuSectionProps {
  children: React.ReactNode;
  label: string;
}

const MenuSectionRoot = styled('li')`
  list-style: none;

  & > ul {
    padding-left: 0;
  }
`;

const MenuSectionLabel = styled('span')`
  display: inline-block;
  font-size: 0.875em;
  alignment-baseline: baseline;
  align-content: end;
  color: #979797;
`;

function MenuSection({ children, label }: Readonly<MenuSectionProps>) {
  return (
    <MenuSectionRoot role="menusection">
      <Box style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', margin: '0.75rem' }}>
        <MenuSectionLabel >{label}</MenuSectionLabel>
        <MenuItem>
          <Link underline="none" to='/create' style={{ display: 'inline-block', fontSize: '0.875em' }} >All templates</Link>
        </MenuItem>
      </Box>
      <ul style={{ marginLeft: 12, marginRight: 12 }}>{children}</ul>
    </MenuSectionRoot>
  );
}

export const GlobalHeader = () => {
  const Search = styled('div')(({ theme }) => ({
    position: 'relative',
    borderRadius: theme.shape.borderRadius,
    backgroundColor: 'transparent',
    marginRight: theme.spacing(2),
    marginLeft: 0,
    width: '100%',
    [theme.breakpoints.up('sm')]: {
      marginLeft: 0,
      width: 'auto',
    },
  }));

  const SearchIconWrapper = styled('div')(({ theme }) => ({
    padding: theme.spacing(0, 2),
    height: '100%',
    position: 'absolute',
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  }));

  const StyledInputBase = styled(InputBase)({
    color: 'inherit',
    width: '100%',
    '& input': {
      paddingLeft: '3rem'
    }
  });

  const Listbox = styled('ul')(
    ({ theme }) => `
    font-family: 'IBM Plex Sans', sans-serif;
    font-size: 0.875rem;
    box-sizing: border-box;
    padding: 0;
    margin: 0;
    min-width: 188px;
    border-radius: 3px;
    overflow: auto;
    outline: 1;
    background: ${theme.palette.mode === 'dark' ? theme.palette.background.default : '#fff'};
    border: 1px solid ${theme.palette.mode === 'dark' ? theme.palette.divider : theme.palette.background.default};
    color: ${theme.palette.mode === 'dark' ? theme.palette.text.disabled : theme.palette.text.primary};
    box-shadow: 0 4px 6px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.50)' : 'rgba(0,0,0, 0.05)'
      };
    z-index: 1;
    `,
  );
  return (
    <AppBar position="sticky" component="nav" sx={{ backgroundColor: '#212427' }}>
      <Toolbar>
        <Search sx={{ flexGrow: 1 }}>
          <SearchIconWrapper>
            <SearchIcon />
          </SearchIconWrapper>
          <StyledInputBase
            placeholder="Search…"
            inputProps={{ 'aria-label': 'search' }}
          />
        </Search>
        <Dropdown>
          <MenuButton slots={{ root: 'div' }}>
            <Button color="primary" variant='contained' sx={{ marginRight: '1rem' }} >
              Create
              <ArrowDropDownOutlinedIcon sx={{ marginLeft: '0.5rem' }} />
            </Button>
          </MenuButton >
          <Menu slots={{ listbox: Listbox }} >
            <MenuSection label="Use a template" >
              {models.map((m) => (
                <MenuItem
                  key={m.key}
                  style={{ listStyle: 'none', marginTop: 16, marginBottom: 16 }}
                >
                  <Link to={`/create/templates/default/${m.value}`} underline="none">
                    <Typography variant="body2" color="text.primary" sx={{ lineHeight: '1.5rem' }}>{m.label}</Typography>
                  </Link>
                </MenuItem>
              ))}
            </MenuSection>
            <div style={{ width: '100%', height: 1, backgroundColor: '#EBEBEB' }}></div>
            <MenuItem
              key="custom"
              style={{ listStyle: 'none', marginTop: 8, marginBottom: 8, display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}
            >
              <ListItemIcon sx={{ padding: '0 0.75rem', minWidth: '1.5rem' }}>
                <CategoryOutlinedIcon fontSize="small" />
              </ListItemIcon>
              <Link to={`/catalog-import`} underline="none" style={{ display: 'flex', flexDirection: 'column' }}>
                <Typography variant="body2" color="text.primary" sx={{ lineHeight: '1.5rem' }}>Register a component</Typography>
                <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.875rem' }}>Import it to the catalog page</Typography>
              </Link>
            </MenuItem>
          </Menu>
        </Dropdown>
        <IconButton
          size="small"
          edge="start"
          color="inherit"
          aria-label="help"
          style={{ margin: '1.25rem' }}
        >
          <HelpOutlineOutlinedIcon fontSize="small" />
        </IconButton>
        <IconButton
          size="small"
          edge="start"
          color="inherit"
          aria-label="help"
          style={{ marginRight: '1.25rem' }}
        >
          <NotificationsOutlinedIcon fontSize="small" />
        </IconButton>
        <div style={{ width: '1px', minHeight: 'inherit', backgroundColor: '#383838' }}></div>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Dropdown>
            <MenuButton slots={{ root: 'div' }}>
              <Button color="inherit" sx={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }}>
                <IconButton
                  size="small"
                  edge="start"
                  color="inherit"
                  aria-label="help"
                  style={{ margin: '0 0.75rem 0 1rem' }}
                >
                  <AccountCircleOutlinedIcon fontSize="small" />
                </IconButton>
                <Typography variant="body2" sx={{ fontWeight: '500 !important', margin: '0 0.5rem' }}>John Smith</Typography>
                <KeyboardArrowDownOutlinedIcon sx={{ marginLeft: '1rem', bgcolor: '#383838', borderRadius: '25%' }} />
              </Button>
            </MenuButton>
            <Menu slots={{ listbox: Listbox }}>
              <MenuItem key="settings" style={{ listStyle: 'none', margin: 16 }}>
                <Link to={`/settings`} underline="none" style={{ display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center', color: 'inherit' }}>
                  <ManageAccountsOutlinedIcon fontSize='small' sx={{ marginRight: '0.5rem' }} />
                  <Typography variant="body2">Settings</Typography>
                </Link>
              </MenuItem>
              <MenuItem key="logout" style={{ listStyle: 'none', margin: 16, display: 'flex', flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' }}>
                <LogoutOutlinedIcon fontSize='small' sx={{ marginRight: '0.5rem' }} />
                <Typography variant="body2">Log out</Typography>
              </MenuItem>
            </Menu>
          </Dropdown>
        </Box>
      </Toolbar>
    </AppBar>
  )
}