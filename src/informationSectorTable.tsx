import * as ReactDOM from "react-dom";
import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
} from "@material-ui/core";
import {
  modelOfSmartSector,
  WebModelSmartSector,
  DataRow,
} from "./smartSectorWebApi.ts/webApiSmartSector";

export interface tableConfig {
  selector: string;
}

interface Filters {
  code: string;
  name: string;
  group: string;
}

export class DataTableInfo {
  selector: string;
  modelSmartSectorApi: WebModelSmartSector;

  constructor(_selector: tableConfig) {
    this.selector = _selector.selector;
    this.modelSmartSectorApi = modelOfSmartSector({
      endpoint: "./api",
      model: "SMART_TABLE_RECORDS",
      asJsonFiles: true,
    });
  }

  async update() {
    const dataTable: DataRow[] =
      await this.modelSmartSectorApi.sectorRecordList();
    ReactDOM.render(
      <DataTable dataTable={dataTable} />,
      document.querySelector(this.selector),
    );
  }
}

const DataTable = (props: { dataTable: DataRow[] }) => {
  const [data, setData] = React.useState<DataRow[]>([]); // Typed as an array of DataRow
  const [filteredData, setFilteredData] = React.useState<DataRow[]>([]); // Typed as an array of DataRow
  const [filters, setFilters] = React.useState<Filters>({
    // Filters are typed as Filters
    code: "",
    name: "",
    group: "",
  });

  // Fetch JSON data
  React.useEffect(() => {
    setData(props.dataTable);
  }, []);

  React.useEffect(() => {
    setFilteredData(data);
  }, [data]);

  const handleFilterChange = (event: any) => {
    const { name, value } = event.target;
    setFilters((prevFilters) => ({
      ...prevFilters,
      [name]: value,
    }));
  };

  React.useEffect(() => {
    const filtered = data.filter((row) => {
      console.log(filters.code);
      const matchesId =
        filters.code === "" ||
        row.Code.toLowerCase().includes(filters.code.toLowerCase());
      const matchesCode =
        filters.name === "" ||
        row.Name.toLowerCase().includes(filters.name.toLowerCase());
      const matchesGroup =
        filters.group === "" ||
        row.Group.toLowerCase().includes(filters.group.toLowerCase());

      return matchesId && matchesCode && matchesGroup;
    });
    setFilteredData(filtered);
  }, [filters]);

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <TextField
          label="Filter by CODE"
          variant="outlined"
          name="code"
          value={filters.code}
          onChange={handleFilterChange}
          style={{ marginRight: 10 }}
        />
        <TextField
          label="Filter by Name"
          variant="outlined"
          name="name"
          value={filters.name}
          onChange={handleFilterChange}
          style={{ marginRight: 10 }}
        />
        <TextField
          label="Filter by Group"
          variant="outlined"
          name="group"
          value={filters.group}
          onChange={handleFilterChange}
        />
      </div>

      <TableContainer component={Paper}>
        <Table aria-label="simple table">
          <TableHead>
            <TableRow>
              <TableCell>BEA/NAICS Code</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Group</TableCell>
              <TableCell>Description</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.Code}>
                <TableCell component="th" scope="row">
                  {row.Code}
                </TableCell>
                <TableCell>{row.Name}</TableCell>
                <TableCell>{row.Group}</TableCell>
                <TableCell>{row.Description}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
};
