import { InboxOutlined } from "@ant-design/icons";
import { message } from "antd";
import Dragger, { DraggerProps } from "antd/es/upload/Dragger";


interface CoverUploadProps {
  value?: string
  onChange?: (value: string) => void
}


export default function CoverUpload(props: CoverUploadProps) {
  const draggerProps: DraggerProps = {
    name: 'file',
    action: "http://localhost:3000/book/upload",
    method: 'POST',
    onChange(info) {
      const { status } = info.file;
      if (status === 'done') {
        console.log('Upload response:', info.file.response);

        // 根据实际响应调整这一行，例如:
        const filePath = info.file.response.url;

        props.onChange?.(filePath);
        message.success(`${info.file.name} 文件上传成功`);
      } else if (status === 'error') {
        console.error('Upload error:', info.file.error);
        message.error(`${info.file.name} 文件上传失败`);
      }
    }
  };

  return props?.value ? (
    <div>
      <img
        src={`http://localhost:3000${props.value}`}
        alt="封面"
        width="100"
        height="100"
        onError={(e) => {
          console.error('Image load error:', e);
          console.log('Attempted URL:', `http://localhost:3000${props.value}`);
        }}
      />
    </div>
  ) : (
    <Dragger {...draggerProps}>
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <p className="ant-upload-text">点击或拖拽文件到此处上传</p>
    </Dragger>
  );
}