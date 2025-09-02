import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa, { ParseResult } from "papaparse";
import { Button, makeStyles } from "@material-ui/core";
import { CircularProgress, Typography } from '@material-ui/core';
const useStyles = makeStyles({
  container: {
    margin: "2em .5em",
    borderRadius: "0 !important"
  },

})
interface RecordData {
  [key: string]: string;
}

export interface DownloadCSVButtonProps {
  fileObjects: {
    filename: string,
    perspective: string,
    selectorList?: string[],
    sector?: string
  }
}

const DownloadCSVButton: React.FC<DownloadCSVButtonProps> = ({ fileObjects }) => {
  const [loading, setLoading] = useState(false);

  const classes = useStyles();
  let fileName = fileObjects.filename;
  fileName += ((fileObjects.perspective == "final") ? "-Point-of-Consumption.csv" : "-Supply-Chain.csv");
  async function getCVSfile() {
    setLoading(true)
    let parsed: ParseResult<RecordData>
    try {
      const res = await axios
        .get<string>(`./downloadCsvFiles/${fileName}`, { responseType: "text" });
      parsed = Papa.parse<RecordData>(
        res.data,
        {
          header: true,
          skipEmptyLines: true,
        }
      );
    }
    catch (error) {
      console.error("Error:", error)
    }
    finally {
      setLoading(false)
    }
    return parsed
  };

  const handleDownload = async () => {
    let downloadFilename: string = ''
    let filtered: RecordData[] = []
    let url
    if (fileObjects.sector) {
      let parse = await getCVSfile();
      let records = parse.data
      let headers = parse.meta.fields
      
      if (records.length > 0) {
        downloadFilename = `${fileObjects.sector}_${fileName}`;
        filtered = records.filter(
          (row) => row["sector"] === fileObjects.sector
        )
        const csv = Papa.unparse({
          fields: headers,
          data: filtered.map((row) => headers.map((h) => row[h] ?? "")),
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        url = URL.createObjectURL(blob);
      }
    }
    else if (fileObjects.selectorList) {
      let parse = await getCVSfile();
      let records = parse.data
      let headers = parse.meta.fields

      if (records.length > 0) {
        downloadFilename = `Custom_Sector_List_${fileName}`;
        fileObjects.selectorList.forEach(
          sector => {
            filtered.push(...records.filter(
              (row) => row["sector"] === sector
            ))
          }
        )
        const csv = Papa.unparse({
          fields: headers,
          data: filtered.map((row) => headers.map((h) => row[h] ?? "")),
        });
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        url = URL.createObjectURL(blob);
      }
    }
    else {
      url = `./downloadCsvFiles/${fileName}`;
    }

    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div>
      {loading ?
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <CircularProgress size={70} />
          <Typography style={{ marginTop: 25 }}>
            Creating CSV File...
          </Typography>
        </div>
        : ""
      }
      <Button variant="outlined" color="primary" onClick={handleDownload} className={classes.container}>
        Download Data (CSV)
      </Button>
    </div>
  );
};

export default DownloadCSVButton;
