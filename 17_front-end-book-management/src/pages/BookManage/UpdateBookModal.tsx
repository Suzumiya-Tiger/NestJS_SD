import { Button, Form, Input, Modal, message } from "antd";
import { useForm } from "antd/es/form/Form";
import TextArea from "antd/es/input/TextArea";
import CoverUpload from "./CoverUpload";
import { detail, update } from "../../interfaces";
import { useEffect } from "react";
interface UpdateBookModalProps {
  id: number;
  isOpen: boolean;
  handleClose: () => void
}
const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 18 }
}

export interface UpdateBook {
  id: number;
  name: string;
  author: string;
  description: string;
  cover: string;
}


export function UpdateBookModal(props: UpdateBookModalProps) {
  useEffect(() => {
    query()
  }, [props.id])
  const [form] = useForm<UpdateBook>()
  const handleOk = async function () {
    await form.validateFields()
    try {
      const res = await update(props.id, form.getFieldsValue())
      if (res.status === 200 || res.status === 201) {
        message.success('编辑图书成功')
        props.handleClose()
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  async function query() {
    if (!props.id) {
      return
    }

    try {
      const res = await detail(props.id)
      if (res.status === 200 || res.status === 201) {
        form.setFieldsValue(res.data)
      }
    } catch (error) {
      console.log('error', error)
    }
  }



  const handleModalClose = function () {
    form.resetFields()
    props.handleClose()
  }
  return <Modal title="编辑图书" open={props.isOpen} onOk={handleOk} onCancel={handleModalClose}>
    <Form form={form} colon={false} {...layout}>
      <Form.Item label="图书名称" name="name" rules={[{ required: true, message: '图书名称不能为空' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="图书作者" name="author" rules={[{ required: true, message: '图书作者不能为空' }]}>
        <Input />
      </Form.Item>
      <Form.Item label="描述" name="description" rules={[{ required: true, message: '图书描述不能为空' }]}>
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item label="封面" name="cover" rules={[{ required: true, message: '封面不能为空' }]}>
        <CoverUpload />
      </Form.Item>
    </Form>
  </Modal>

}