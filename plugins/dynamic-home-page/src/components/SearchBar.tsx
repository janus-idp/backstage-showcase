import React, { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { SearchBarBase } from '@backstage/plugin-search-react';

import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(theme => ({
  searchBar: {
    backgroundColor: theme.palette.type === 'dark' ? '#36373A' : '#FFFFFF',
    boxShadow: 'none',
    border: `1px solid ${theme.palette.type === 'dark' ? '#57585a' : '#E4E4E4'}`,
    borderRadius: '50px',
    margin: 0,
  },
  notchedOutline: {
    borderStyle: 'none !important',
  },
}));

export interface SearchBarProps {
  path?: string;
  queryParam?: string;
}

export const SearchBar = ({ path, queryParam }: SearchBarProps) => {
  const classes = useStyles();
  const [value, setValue] = useState('');
  const ref = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // This handler is called when "enter" is pressed
  const handleSubmit = useCallback(() => {
    const query = ref.current?.value ?? '';

    const url = new URL(window.location.toString());
    url.pathname = path ?? '/search';
    url.searchParams.set(queryParam ?? 'query', query);
    const search = url.searchParams.toString();

    navigate(`${url.pathname}${search ? '?' : ''}${search}`);
  }, [navigate, path, queryParam]);

  return (
    <SearchBarBase
      placeholder="Search"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      inputProps={{ ref }}
      classes={{
        root: classes.searchBar,
      }}
      InputProps={{
        classes: {
          notchedOutline: classes.notchedOutline,
        },
      }}
    />
  );
};
