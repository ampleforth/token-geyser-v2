import { Align } from "../constants"
import { ReactNode } from "react"
import styled from "styled-components/macro"
import tw from "twin.macro"

export type Column = {
  title: ReactNode
  dataIndex: string
  key: string | number
  textAlign?: Align
}

export type DataSource = {
  [index: string]: ReactNode
  key: string | number
  textAlign?: Align
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

  const getAlignmentClass = (textAlign: Align) => {
    switch(textAlign) {
      case Align.CENTER: return 'text-center'
      case Align.LEFT: return 'text-left'
      case Align.RIGHT: return 'text-right'
      default: return ''
    }
  }

  return (
    <TableContainer>
      <TableContent>
        <TableHead>
          <tr>
            {columns.map(({ title, key, textAlign }) => (
              <HeaderCell
                key={key}
                className={getAlignmentClass(textAlign || Align.LEFT)}
              >
                {title}
              </HeaderCell>
            ))}
          </tr>
        </TableHead>
        <TableBody>
          {rows.map((row, rowNumber) => (
            <tr key={dataSource[rowNumber].key}>
              {row.map((cell, colNumber) => {
                console.log(columns[colNumber])
                return (
                  <RowCell className={getAlignmentClass(columns[colNumber].textAlign || Align.LEFT)}>
                    {cell}
                  </RowCell>
                )
              })}
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
  ${tw`divide-y divide-gray`}
`

const HeaderCell = styled.th`
  ${tw`px-6 py-3 text-xs font-medium uppercase tracking-wider`}
`

const RowCell = styled.td`
  ${tw`px-6 py-4 whitespace-nowrap`}
`
