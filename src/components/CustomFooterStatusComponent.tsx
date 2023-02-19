import { Box } from "@mui/material";
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';

export function CustomFooterStatusComponent(props: {
    connectionStatus: 'Connecting' | 'Open' | 'Closing' | 'Closed' | 'Uninstantiated';
  }) {
    return (
      <Box sx={{ p: 1, display: 'flex' }}>
        <FiberManualRecordIcon
          fontSize="small"
          sx={{
            mr: 1,
            color: () => {
                if (props.connectionStatus === 'Open')
                    return '#4caf50'; //green
                else if (props.connectionStatus === 'Connecting') 
                    return '#fa8b2e'; //orange
                else
                    return '#d9182e'; //red
            },
          }}
        />
        Status {props.connectionStatus}
      </Box>
    );
  }
