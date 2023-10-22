import React, { useEffect, useState } from 'react'
// import './index.css'
import { Space, Button, Card, Table, Tag, Grid } from 'antd'
import { FolderAddOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import LogViewerClass from '../log-viewer/log-viewer'
import { ipcRenderer } from 'electron'

const columns: ColumnsType<DataType> = [
  {
    title: 'ID',
    dataIndex: 'id',
    key: 'id',
  },
  {
    title: '账号',
    dataIndex: 'name',
    key: 'name',
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    key: 'email',
  },
  {
    title: '账号昵称',
    key: 'Cookie',
    dataIndex: 'cookie',
  },
  {
    title: '状态',
    key: 'status',
    dataIndex: 'status',
    width: 250,
    shouldCellUpdate: (record, prevRecord) => record.status != prevRecord.status,
  },
  {
    title: '备注',
    key: 'remarks',
    dataIndex: 'remarks',
  },
  {
    title: '注册时间',
    key: 'registerTime',
    dataIndex: 'registerTime',
  },
  {
    title: '操作',
    key: 'action',
    render: (_, record) => (
      <Space size="middle">
        <a
          onClick={(e) => {
            e.stopPropagation()
            ipcRenderer.send('start-single-login', record)
          }}
        >
          开始注册
        </a>
      </Space>
    ),
  },
]

let globalData: DataType[] = []
declare interface GridState {
  resData: DataType[]
}

// const [size, setSize] = useState<SizeType>('large') // default is 'middle'
const Hello = () => {
  const [resData, setResData] = useState<DataType[]>([])
  useEffect(() => {
    ipcRenderer.on('select-excel-done', (e: AnyObj, msg: TKAccount[]) => {
      const data: DataType[] = msg.map((item) => {
        const dataType: DataType = {
          key: item.id,
          id: item.id,
          name: '',
          email: item.email,
          password: item.password,
          tk_password: '',
          cookie: '',
          status: '未注册',
          remarks: '',
          registerTime: '',
        }
        return dataType
      })
      globalData = data
      setResData(data)
    })
    ipcRenderer.on('status-update', function (evt, message) {
      console.log('UI')
      console.log(message)
      try {
        const msgObj = JSON.parse(message)
        const newData = [...globalData]
        const dataItem = newData.find((ele) => ele.email == msgObj.email)
        if (dataItem) {
          console.log('找到了并更新:' + msgObj.content)
          dataItem.status = msgObj.content
          dataItem.key = Date.parse(new Date().toString())
        }
        setResData(newData)
      } catch (e) {}
    })
    return () => {
      //   ipcRenderer.removeAllListeners('ping')
    }
  }, [resData])

  return <Table columns={columns} pagination={{ position: ['bottomRight'] }} dataSource={resData} />
}

export default class GridDemo extends React.Component<AnyObj, GridState> {
  state: GridState = {
    resData: [],
  }

  // 构造函数
  constructor(props: AnyObj) {
    super(props)
  }

  componentDidMount(): void {
    console.log(this)
  }

  render(): JSX.Element {
    return (
      <div className="layout-padding">
        <Card>
          <Space style={{ width: '100%' }}>
            <Button type="primary" onClick={this.selectExcelFile} icon={<FolderAddOutlined />} size="large">
              导入表格
            </Button>
            <Button type="primary" onClick={this.startBatchLogin} icon={<FolderAddOutlined />} size="large">
              开始登陆
            </Button>
          </Space>
          <Hello></Hello>
        </Card>
        <Card>{/* <LogViewerClass></LogViewerClass> */}</Card>
      </div>
    )
  }

  selectExcelFile = (): void => {
    ipcRenderer.send('open-directory-dialog', 'openFile')
  }
  startBatchLogin = (): void => {
    ipcRenderer.send('start-batch-login', globalData)
  }
} // class GridDemo end
