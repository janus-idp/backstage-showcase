import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import CheckCircle from '@material-ui/icons/CheckCircle';
import Cancel from '@material-ui/icons/Cancel';

const useStyles = makeStyles({
  verticalCenter: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  pl3: {
    paddingLeft: '3px',
  },
  success: {
    color: '#388e3c',
  },
  error: {
    color: '#c62828',
  },
});

type PropTypes = {
  status: string;
  statusText: string;
};

export const TeamcityStatus = (props: PropTypes) => {
  const classes = useStyles();

  const getIcon = (status: string) => {
    switch (status) {
      case 'FAILURE':
        return <Cancel fontSize="small" className="icon" />;
      case 'SUCCESS':
        return <CheckCircle fontSize="small" className="icon" />;
      default:
        return <></>;
    }
  };

  const getClass = (status: string): string => {
    switch (status) {
      case 'FAILURE':
        return classes.error;
      case 'SUCCESS':
        return classes.success;
      default:
        return '';
    }
  };

  return (
    <span
      className={[getClass(props.status), classes.verticalCenter].join(' ')}
    >
      {getIcon(props.status)}
      <span className={classes.pl3}>{props.statusText}</span>
    </span>
  );
};
