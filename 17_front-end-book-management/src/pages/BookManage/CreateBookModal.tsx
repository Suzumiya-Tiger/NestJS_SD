import { Button, Form, Input, Modal, message } from "antd";
import { useForm } from "antd/es/form/Form";
import TextArea from "antd/es/input/TextArea";
import { create } from "../../interfaces";
import CoverUpload from "./CoverUpload";



interface CreateBookModalProps {
  isOpen: boolean
  handleClose: () => void
}

const layout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 16 }
}

export interface CreateBook {
  name: string;
  author: string;
  description: string;
  cover: string;
}


export function CreateBookModal(props: CreateBookModalProps) {
  const [form] = useForm<CreateBook>()
  const handleOk = async function () {
    await form.validateFields()
    const values = form.getFieldsValue()
    try {
      const res = await create(values)
      if (res.status === 200 || res.status === 201) {
        message.success('新增图书成功')
        props.handleClose()
      }
    } catch (error) {
      console.log('error', error)
    }
  }

  const handleModalClose = function () {
    form.resetFields()
    props.handleClose()
  }

  return <Modal title="新增图书" open={props.isOpen} onOk={handleOk} onCancel={handleModalClose}>
    <Form
      form={form}
      colon={false}
      {...layout}
    >
      <Form.Item label="图书名称" name="name" rules={[
        { required: true, message: '图书名称不能为空' }
      ]}>
        <Input />
      </Form.Item>
      <Form.Item label="图书作者" name="author" rules={[
        { required: true, message: '图书作者不能为空' }
      ]}>
        <Input />
      </Form.Item>
      <Form.Item
        label="描述" name="description" rules={[
          { required: true, message: '图书描述不能为空' }
        ]}
      >
        <TextArea rows={4} />
      </Form.Item>
      <Form.Item label="封面" name="cover" rules={[
        { required: true, message: '封面不能为空' }
      ]}
      >
        <CoverUpload />
      </Form.Item>
    </Form>
  </Modal>
}

