import { EntityTechdocsContent } from '@backstage/plugin-techdocs';
import { ReportIssue } from '@backstage/plugin-techdocs-module-addons-contrib';
import { TechDocsAddons } from '@backstage/plugin-techdocs-react';
import Grid from '@mui/material/Grid';
import React from 'react';

export const techdocsContent = (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <EntityTechdocsContent>
        <TechDocsAddons>
          <ReportIssue />
        </TechDocsAddons>
      </EntityTechdocsContent>
    </Grid>
  </Grid>
);
