import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa, { ParseResult } from "papaparse";
import { Button, makeStyles } from "@material-ui/core";
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
    selectorList?:string[],
    sector?: string
  }
}

const DownloadCSVButton: React.FC<DownloadCSVButtonProps> = ({ fileObjects }) => {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const classes = useStyles();
  let fileName = fileObjects.filename;
  fileName += ((fileObjects.perspective == "final") ? "-Point-of-Consumption.csv" : "-Supply-Chain.csv");
  useEffect(() => {
    axios
      .get<string>(`./downloadCsvFiles/${fileName}`, { responseType: "text" })
      .then((res) => {
        const parsed: ParseResult<RecordData> = Papa.parse<RecordData>(
          res.data,
          {
            header: true,
            skipEmptyLines: true,
          }
        );

        if (parsed.meta.fields) {
          setHeaders(parsed.meta.fields);
        }
        setRecords(parsed.data);
      }).catch( error => {
        console.error('Error:',error)
        setRecords([])
      }
    )
  }, [fileObjects.filename, fileObjects.sector, fileObjects.perspective]);

  const handleDownload = () => {
    if(records.length > 0){
    let downloadFilename:string = ''
    let filtered:RecordData[] = []
    if (fileObjects.sector) {
        downloadFilename =  `${fileObjects.sector}_${fileName}`;
      filtered = records.filter(
        (row) => row["sector"] === fileObjects.sector
      )
    }
    else if(fileObjects.selectorList)
    {
      downloadFilename =  `Custom_Sector_List_${fileName}`;
      fileObjects.selectorList.forEach(
        sector => {
          filtered.push(...records.filter(
        (row) => row["sector"] === sector
      ))
        }
      )
    }
    else {
    downloadFilename = `${fileName}`

      filtered = records
    }

    const csv = Papa.unparse({
      fields: headers,
      data: filtered.map((row) => headers.map((h) => row[h] ?? "")),
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = downloadFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

  return (
    <Button variant="outlined" color="primary" onClick={handleDownload} className={classes.container}>
      Download Data (CSV)
    </Button>
  );
};

export default DownloadCSVButton;
