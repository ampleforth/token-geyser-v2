import { ReactNode } from "react"
import styled from "styled-components/macro"
import tw from "twin.macro"
import { Align } from "../constants"

export type Column = {
  title: ReactNode
  dataIndex: string
  key: string | number
  widthClass?: string
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
    columns.map(({ dataIndex }) => Object.getOwnPropertyDescriptor(source, dataIndex) ? source[dataIndex] : '')
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

  const getPaddingClass = (colNumber: number, numCols: number) =>
    (colNumber === 0 && 'pl-3') || (colNumber === numCols - 1 && 'pr-3') || ''

  return (
    <TableContent>
      <TableHead>
        <tr>
          {columns.map(({ title, key, textAlign, widthClass }, colNumber) => (
            <HeaderCell
              key={key}
              className={`${getAlignmentClass(textAlign || Align.LEFT)} ${widthClass} ${getPaddingClass(colNumber, columns.length)}`}
            >
              {title}
            </HeaderCell>
          ))}
        </tr>
      </TableHead>
      <TableBody>
        {rows.map((row, rowNumber) => (
          <>
            <TableRow key={dataSource[rowNumber].key}>
              {row.map((cell, colNumber) => (
                <RowCell
                  key={`${dataSource[rowNumber].key}-${columns[colNumber].key}`}
                  className={`${getAlignmentClass(columns[colNumber].textAlign || Align.LEFT)} ${getPaddingClass(colNumber, columns.length)}`}
                >
                  {cell}
                </RowCell>
              ))}
            </TableRow>
            {rowNumber !== rows.length - 1 && <Spacer />}
          </>
        ))}
      </TableBody>
    </TableContent>
  )
}

const TableContent = styled.table`
  width: 100%;
  ${tw`table-fixed border-collapse space-y-2`}
`

const TableRow = styled.tr`
  ${tw`border border-lightGray h-72px`}
`

const TableHead = styled.thead``

const TableBody = styled.tbody``

const HeaderCell = styled.th`
  ${tw`sm:px-6 py-3 text-xs font-medium uppercase tracking-wider`}
`

const Spacer = styled.tr`
  ${tw`h-10px`}
`

const RowCell = styled.td`
  ${tw`text-xs`}
  ${tw`sm:px-6 sm:text-base whitespace-nowrap`}
`
