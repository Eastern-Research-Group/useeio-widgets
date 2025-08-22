import React, { useEffect, useState } from "react";
import axios from "axios";
import Papa, { ParseResult } from "papaparse";
import { Button, makeStyles} from "@material-ui/core";
const useStyles = makeStyles({
  container: {
    margin: "2em .5em",
    borderRadius: "0 !important"
  },

})
interface RecordData {
  [key: string]: string;
}

interface Props {
  filename: string;
  perspective:string;
  sector: string;
}

const DownloadCSVButton = (props: { fileObjects: Props }) => {
  const [records, setRecords] = useState<RecordData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const classes = useStyles();
  let fileName = props.fileObjects.filename;
  fileName += ((props.fileObjects.perspective == "final") ? "-Point-of-Consumption.csv" : "-Supply Chain.csv");
  useEffect(() => {
    axios
      .get<string>(`/downloadCsvFiles/${fileName}`, { responseType: "text" })
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
      });
  }, [props.fileObjects.filename, props.fileObjects.sector, props.fileObjects.perspective]);

  const handleDownload = () => {
    const filtered = records.filter(
      (row) => row["sector"] === props.fileObjects.sector
    );

    const csv = Papa.unparse({
      fields: headers,
      data: filtered.map((row) => headers.map((h) => row[h] ?? "")),
    });

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `${props.fileObjects.sector}_${fileName}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Button variant="contained" color="primary" onClick={handleDownload} className={classes.container}>
      Download File
    </Button>
  );
};

export default DownloadCSVButton;
