import Excel from 'exceljs'

const getCellValue = (row: Excel.Row, cellIndex: number) => {
  const cell = row.getCell(cellIndex)

  return cell.value ? cell.value.toString() : ''
}

export function getAccountsFromExcel(filePath: string): Promise<TKAccount[]> {
  return new Promise(async (resolve) => {
    const workbook = new Excel.Workbook()
    console.log('路径:', filePath)
    const content = await workbook.xlsx.readFile(filePath)
    console.log('内容:', content.worksheets.length)

    const worksheet = content.worksheets[0]
    const rowStartIndex = 2
    const numberOfRows = worksheet.rowCount - 1

    const rows = worksheet.getRows(rowStartIndex, numberOfRows) ?? []

    const accounts = rows.map((row): TKAccount => {
      return {
        id: row.number - 1,
        // @ts-ignore
        email: getCellValue(row, 2),
        // @ts-ignore
        password: getCellValue(row, 3),
        // @ts-ignore
        codeApi: getCellValue(row, 4),
      }
    })

    console.log(accounts)
    resolve(accounts)
    return accounts
  })
}
