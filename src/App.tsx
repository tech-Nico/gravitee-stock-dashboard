import { Grid, Stack } from '@mui/material';
import React from 'react';
import './App.css';
import StockDashboard from './components/StockDashboard';

function App() {
  return (
    // <div className="App">
    //   <div style={{height: 350, width: 800}}>
      <Grid
        container
        spacing={0}
        //direction="column"
        alignItems="center"
        justifyContent="center"
        style={{ minHeight: '100vh' }}
      >
        <Stack>
          
            <h1 style={{textAlign: "center"}}>Gravitee stock dashboard</h1>
          
        <Grid >
            <StockDashboard />
        </Grid>   
        </Stack>
      </Grid> 
        
    //   </div>  
    // </div>
  );
}

export default App;
