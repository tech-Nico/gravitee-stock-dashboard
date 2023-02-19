import * as React from 'react';
import { 
    DataGrid, 
    GridRowsProp, 
    GridColDef, 
    GridValueFormatterParams, 
    GridValueSetterParams, 
    GridToolbar,
    useGridApiRef, 
    GridValueGetterParams,
    GridRenderCellParams,
    GridRowModel,
    GridCellEditStopParams,
    GridCellEditStopReasons,
    MuiEvent,
    GridCellEditStartParams,
    GridCellEditStartReasons
    } from '@mui/x-data-grid';
// When using TypeScript 4.x and above
import type {} from '@mui/x-data-grid/themeAugmentation';
import { darken, lighten, styled } from '@mui/material/styles';
import { 
  Alert, 
  Box, 
  Grid, 
  IconButton, 
  Snackbar, 
  TextField 
  } from '@mui/material';
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { CustomFooterStatusComponent } from './CustomFooterStatusComponent';
import ShoppingCart from '@mui/icons-material/ShoppingCart';
import Sell from '@mui/icons-material/Sell';
import { sync } from 'resolve';
import { alignProperty } from '@mui/material/styles/cssUtils';

const rows: GridRowsProp = [];

const getBackgroundColor = (color: string, mode: string) => mode === 'dark' ? darken(color, 0.7) : lighten(color, 0.7);
const getHoverBackgroundColor = (color: string, mode: string) => mode === 'dark' ? darken(color, 0.6) : lighten(color, 0.6);
const getSelectedBackgroundColor = (color: string, mode: string) => mode === 'dark' ? darken(color, 0.5) : lighten(color, 0.5);
const getSelectedHoverBackgroundColor = (color: string, mode: string) => mode === 'dark' ? darken(color, 0.4) : lighten(color, 0.4);

const calcVariation = (newPrice: number, oldPrice: number) : number => {
  return (newPrice == oldPrice? 0.0 : ((newPrice - oldPrice) / oldPrice) * 100);
}

const StyledDataGrid = styled(DataGrid)(({ theme }) => ({
  '& .super-app-theme--Negative': {
    backgroundColor: getBackgroundColor(
      theme.palette.error.main,
      theme.palette.mode,
    ),
    '&:hover': {
      backgroundColor: getHoverBackgroundColor(
        theme.palette.error.main,
        theme.palette.mode,
      ),
    },
    '&.Mui-selected': {
      backgroundColor: getSelectedBackgroundColor(
        theme.palette.error.main,
        theme.palette.mode,
      ),
      '&:hover': {
        backgroundColor: getSelectedHoverBackgroundColor(
          theme.palette.error.main,
          theme.palette.mode,
        ),
      },
    },
  },
  '& .super-app-theme--Open': {
    backgroundColor: getBackgroundColor(theme.palette.info.main, theme.palette.mode),
    '&:hover': {
      backgroundColor: getHoverBackgroundColor(
        theme.palette.info.main,
        theme.palette.mode,
      ),
    },
    '&.Mui-selected': {
      backgroundColor: getSelectedBackgroundColor(
        theme.palette.info.main,
        theme.palette.mode,
      ),
      '&:hover': {
        backgroundColor: getSelectedHoverBackgroundColor(
          theme.palette.info.main,
          theme.palette.mode,
        ),
      },
    },
  }
}));


function getLastUpdated(params: GridValueFormatterParams){
  const date = new Date(params.value);
  const formattedDate = date.toLocaleDateString();
  const formattedTime = date.toLocaleTimeString();
  return formattedDate + " " + formattedTime; 
}

function getFormattedPrice(params: GridValueFormatterParams){
    return "$ " + parseFloat(params.value).toFixed(2);
}
function getPrice(params: GridValueGetterParams){
    return parseFloat(params.value).toFixed(2);
}
function getFormattedVariation(params: GridValueFormatterParams){
    if (params.value == null)
      return "0.0%"; 
    else
      return parseFloat(params.value).toFixed(2) + "%";
}

function setVariation(params: GridValueSetterParams){
    const oldValue = params.row.price;
    const price = params.value;
    const variation = calcVariation(price, oldValue);
    console.log("oldPrice: " + oldValue + ", newPrice: " + price + ", variation: " + variation);
    return {...params.row, price, variation};
}


export default function StockDashboard() {
  const apiRef = useGridApiRef();
  const [syncURL,         setSyncURL]         = React.useState('');
  const [asyncURL,        setAsyncURL]        = React.useState(''); 
  const [isAsyncURLValid, setIsAsyncURLValid] = React.useState(false)
  const [isSyncURLValid,  setIsSyncURLValid]  = React.useState(false)
  const [isError,         setIsError]         = React.useState(false);
  const [errorMessage,    setErrorMessage]    = React.useState("")
  const [isSaved,         setIsSaved]         = React.useState(false);
  const [stockUpdate,     setStockUpdate]     = React.useState({} as any);
  const {lastMessage,     readyState }        = useWebSocket(asyncURL, {
    retryOnError: true,
    reconnectAttempts: 10,
    reconnectInterval: 3000,
  });
  
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];


  const handleUpdateRow = React.useCallback(async (message: MessageEvent) => {
    try{
        console.log("Call to handleUpdateRow");
        const rowIds = apiRef.current.getAllRowIds()
        const rowArray = await message.data.arrayBuffer()
        const textDecoder = new TextDecoder();
        const rowStr = textDecoder.decode(rowArray);
        console.log("RowStr"  + rowStr)
        const row = JSON.parse(rowStr);
        const rowId = rowIds.find((value) => {return value === row.ticketName})
        
        if (rowId == null || rowId <= 0){
            //add new row
            apiRef.current.updateRows([{...row, lastUpdateTS: Date()}]);
        } else {
        
            if (row.ticketName != null && row.ticketName !== ""){
                const currRow = apiRef.current.getRow(rowId);
                const variation = calcVariation(row.price, currRow.price);
                apiRef.current.updateRows([{...row, variation: variation, lastUpdateTS: Date() }]);
            }
        }    
    
    } catch(error){
        console.log("Error while handling WS messages: " + error);
        
    }
    
    
  }, [apiRef]);

  React.useEffect(() => {
    if (lastMessage !== null) {
      handleUpdateRow(lastMessage)
    }
  }, [lastMessage, handleUpdateRow]);


  const buyStock = (row: GridRowModel) => {
    console.log("Buy stock");
    if (!isSyncURLValid){
      setIsError(true);
      setErrorMessage("Please set the REST API URL before buying/selling");
    } else{
      
      apiRef.current.startCellEditMode({id: row.ticketName, field: "price"});
    }
  };

  const sellStock = (row: GridRowModel) => {
    console.log("Selling stock")
    if (!isSyncURLValid){
      setIsError(true);
      setErrorMessage("Please set the REST API URL before buying/selling");
    } else{
      apiRef.current.startCellEditMode({id: row.ticketName, field: "price"});  
    }
  };

  const processRowUpdate = React.useCallback(
    async (newRow: GridRowModel) => {
      const requestOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ticketName: newRow.ticketName, 
          name: newRow.name,
          price: newRow.price
          })
      };
      console.log("Fetching " + syncURL)  
      fetch(syncURL, requestOptions)
        .then(data => setIsSaved(true));

      ;
      //return response;
      setIsSaved(true);
      return newRow;
    }, [stockUpdate, syncURL]);
  

  

  const columns: GridColDef[] = [
    { field: 'ticketName', headerName: 'Symbol', width: 100 },
    { field: 'name', headerName: 'Name', width: 300 },
    { field: 'lastUpdateTS', headerName: 'Last Updated', width: 170, type: "dateTime", valueFormatter: getLastUpdated },
    { 
      field: 'price', 
      headerName: 'Price', 
      width: 200, 
      editable: (isSyncURLValid), 
      align: "center",
      headerAlign: 'center',
      type: "number", 
      valueFormatter: getFormattedPrice,
      valueGetter: getPrice,
      valueSetter: setVariation, 
      renderCell: (params: GridRenderCellParams<Number>) => (
        <div style={{width: '100%'}}>
          <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                p: 1,
                m: 1,
                borderRadius: 1,
              }}
          >
                <IconButton 
                  aria-label="sell"
                  onClick={() => { sellStock(params.row)  }}
                  hidden={!isSyncURLValid}
                >
                  <Sell sx={{ color: "#d9182e" }}/>
                </IconButton>
            <Box sx={{p:1, m:1}}>
              {"$ " + parseFloat(params.value).toFixed(2)} 
             </Box>

              <IconButton 
                  aria-label="buy"
                  hidden={!isSyncURLValid}
                  onClick={() => buyStock(params.row)}
                >
                <ShoppingCart color="success"/>
              </IconButton>
            
          </Box>
         </div>
        
      )
    },
    { 
      field: 'variation', 
      headerName: 'Variation', 
      width: 100, 
      type: "number", 
      valueFormatter: getFormattedVariation, 
    },
  ];
  

  const handleCloseError = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsError(false);
    setErrorMessage("");
  };

  const handleCloseSaveSnack = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }

    setIsSaved(false);
  };

  return (
        <Grid container  >
            <Snackbar open={isError} autoHideDuration={6000} onClose={handleCloseError}>
              <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
              {errorMessage}
              </Alert>
          </Snackbar>
          <Snackbar open={isSaved} autoHideDuration={6000} onClose={handleCloseSaveSnack}>
              <Alert onClose={handleCloseSaveSnack} severity="success" sx={{ width: '100%' }}>
              Operation performed successfully!
              </Alert>
          </Snackbar>
            <Grid item={true}  xs={9}>
                <div style={{ height: 400, width: '100%', paddingBottom: 10 }}>
                <StyledDataGrid 
                    getRowId={(row) => row.ticketName}
                    apiRef={apiRef}
                    rows={rows} 
                    columns={columns} 
                    getRowClassName={(params) => params.row.variation < 0? `super-app-theme--Negative` : `super-app-theme--Open` }
                    components={{
                        Toolbar: GridToolbar,
                        Footer: CustomFooterStatusComponent,
                    }}
                    componentsProps={{
                        footer: { connectionStatus },
                    }}
                    processRowUpdate={processRowUpdate}
                    />
                </div>
            </Grid>
            <Grid item={true} xs={9}>
                <TextField 
                    fullWidth
                    error={!isAsyncURLValid}
                    id="realtimeURL" 
                    label="WS://" 
                    helperText="Enter the Realtime Updates URL"
                    variant="outlined" 
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setAsyncURL(event.target.value);
                        setIsAsyncURLValid(true);
                        }}
                    />
            </Grid>
            <Grid item={true} xs={9} >
                <TextField 
                    fullWidth
                    error={!isSyncURLValid}
                    id="syncApiURL" 
                    label="HTTP://" 
                    helperText="Enter the REST API URL"
                    variant="outlined" 
                    onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                        setSyncURL(event.target.value);
                        setIsSyncURLValid(true);
                        }}
                    />
            </Grid>
        </Grid>
        

  );
}

export {}
