import React from 'react'
import styled from 'styled-components/macro'
import tw from 'twin.macro'

interface TableRowProps {
  label: string
  value: string
}

interface TooltipTableProps {
  rows: TableRowProps[]
  totalLabel: string
  totalValue: string
}

const TooltipTable: React.FC<TooltipTableProps> = ({ rows, totalLabel, totalValue }) => (
  <TooltipTableContainer>
    <Table>
      <tbody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCellLabel>{row.label}</TableCellLabel>
            <TableCellValue>{row.value}</TableCellValue>
          </TableRow>
        ))}
        <TableDivider />
        <TableRowTotal>
          <TableCellLabelTotal>{totalLabel}</TableCellLabelTotal>
          <TableCellValueTotal>{totalValue}</TableCellValueTotal>
        </TableRowTotal>
      </tbody>
    </Table>
  </TooltipTableContainer>
)

export default TooltipTable

const TooltipTableContainer = styled.div`
  ${tw`p-4 bg-gray w-full shadow-md rounded mt-5`}
`

const Table = styled.table`
  ${tw`w-full`}
`

const TableRow = styled.tr`
  ${tw`flex justify-between items-center text-white mb-1`}
`

const TableCellLabel = styled.td`
  ${tw`text-sm text-white`}
`

const TableCellValue = styled.td`
  ${tw`text-sm text-white font-semibold`}
`

const TableRowTotal = styled.tr`
  ${tw`flex justify-between items-center text-white border-t mt-1 pt-1`}
`

const TableCellLabelTotal = styled.td`
  ${tw`text-base text-white font-bold`}
`

const TableCellValueTotal = styled.td`
  ${tw`text-base text-white font-bold`}
`

const TableDivider = styled.tr`
  ${tw`border-t border-gray`}
`
