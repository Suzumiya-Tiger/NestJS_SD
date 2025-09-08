import { Button, Card, Form, Input, message, Popconfirm } from 'antd';
import './index.css';
import { useState, useEffect, useCallback } from 'react';
import { deleteBook, list } from '../../interfaces';
import { CreateBookModal } from './CreateBookModal';
import { UpdateBookModal } from './UpdateBookModal';

interface Book {
  id: number
  name: string
  author: string
  description: string
  cover: string
}

// 自定义刷新Hook
function useRefresh() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const refresh = useCallback(() => {
    setRefreshTrigger(prev => prev + 1);
  }, []);
  return { refreshTrigger, refresh };
}

export default function BookManage() {
  const [bookList, setBookList] = useState<Book[]>([])
  const [searchParams, setSearchParams] = useState<string>()
  const { refreshTrigger, refresh } = useRefresh();

  async function fetchData() {
    try {
      const data = await list(searchParams)
      if (data.status === 200 || data.status === 201) {
        setBookList(data.data)
      }
    } catch (error) {
      console.log('error', error);
    }
  }

  async function handleDelete(id: number) {
    try {
      const res = await deleteBook(id)
      if (res.status === 200 || res.status === 201) {
        message.success('删除成功')
        refresh() // 使用refresh函数
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [searchParams, refreshTrigger]) // 依赖refreshTrigger

  async function searchBook(values: { name: string }) {
    setSearchParams(values.name)
  }
  const [isCreateBookModalOpen, setIsCreateBookModalOpen] = useState(false)
  const [isUpdateBookModalOpen, setIsUpdateBookModalOpen] = useState(false)
  const [updateId, setUpdateId] = useState<number>(0)
  return <div id='bookManage'>
    <CreateBookModal isOpen={isCreateBookModalOpen} handleClose={() => { setIsCreateBookModalOpen(false); refresh() }} />
    <UpdateBookModal isOpen={isUpdateBookModalOpen} handleClose={() => { setIsUpdateBookModalOpen(false); refresh() }} id={updateId} />
    <h1>图书管理系统</h1>
    <div className="content">
      <div className="book-search">
        <Form name="search" layout="inline" colon={false} onFinish={searchBook}>
          <Form.Item label="图书名称" name="name">
            <Input />
          </Form.Item>
          <Form.Item label=" ">
            <Button type='primary' htmlType='submit'>查询</Button>
            <Button type='primary' htmlType='submit' style={{ background: 'green' }}
              onClick={() => setIsCreateBookModalOpen(true)} >新增</Button>
          </Form.Item>
        </Form>
      </div>
      <div className="book-list">
        {
          bookList.map((book: Book) => {

            return <Card key={book.id} className='card'
              hoverable style={{ width: 300 }}
              cover={<img alt="example" src={`http://localhost:3000${book.cover}`} />}
            >
              <h2>{book.name}</h2>
              <div>{book.author}</div>
              <div className="links">
                <a href="#">详情</a>
                <a href="#" onClick={() => { setIsUpdateBookModalOpen(true); setUpdateId(book.id) }}>编辑</a>
                <Popconfirm
                  title="图书删除"
                  description="确定删除该图书吗？"
                  onConfirm={() => {
                    handleDelete(book.id)
                  }}

                >
                  <a href="#">删除</a>
                </Popconfirm>
              </div>
            </Card>
          })
        }
      </div>
    </div>

  </div>;
}