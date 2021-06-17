import { ReactNode } from "react"
import styled from "styled-components/macro"
import tw from "twin.macro"

type Column = {
  title: ReactNode
  dataIndex: string
  key: string | number
}

type DataSource = {
  [index: string]: ReactNode
  key: string | number
}

interface Props {
  columns: Column[]
  dataSource: DataSource[]
}

export const Table: React.FC<Props> = ({ columns, dataSource }) => {
  const getRowFromSource = (source: DataSource) => (
    columns.map(({ dataIndex }) => source.hasOwnProperty(dataIndex) ? source[dataIndex] : '')
  )

  const rows = dataSource.map(getRowFromSource)

  return (
    <TableContainer>
      <TableContent>
        <TableHead>
          <tr>
            {columns.map(({ title, key }) => (
              <HeaderCell key={key}>{title}</HeaderCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => (
            <tr key={dataSource[index].key}>
              {row.map((cell) => (
                <RowCell>{cell}</RowCell>
              ))}
            </tr>
          ))}
        </TableBody>
      </TableContent>
    </TableContainer>
  )
}

const TableContainer = styled.div`
  ${tw`flex flex-col overflow-x-auto`}
`

const TableContent = styled.table`
  ${tw`min-w-full divide-y divide-gray`}
`

const TableHead = styled.thead`
  ${tw``}
`

const TableBody = styled.tbody`
  ${tw`bg-white divide-y divide-gray`}
`

const HeaderCell = styled.th`
  ${tw`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider`}
`

const RowCell = styled.td`
  ${tw`px-6 py-4 whitespace-nowrap text-left`}
`
