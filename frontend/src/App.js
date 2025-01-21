import React, { useState, useEffect } from 'react';
import { Layout, Card, Form, Input, Button, Table, InputNumber, Space, Typography, Row, Col } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import axios from 'axios';

const { Header, Content } = Layout;
const { Title } = Typography;

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

function App() {
  const [courses, setCourses] = useState([]);
  const [form] = Form.useForm();
  const [averageGPA, setAverageGPA] = useState(0);

  // 获取所有课程
  const fetchCourses = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/courses`);
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  // 获取平均GPA
  const fetchAverageGPA = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/gpa/average`);
      setAverageGPA(response.data.average_gpa);
    } catch (error) {
      console.error('Error fetching average GPA:', error);
    }
  };

  useEffect(() => {
    fetchCourses();
    fetchAverageGPA();
  }, []);

  // 计算最终成绩
  const calculateFinalScore = (examScores, regularScore) => {
    if (!examScores || examScores.length === 0) return 0;
    const examAverage = examScores.reduce((sum, score) => sum + score, 0) / examScores.length;
    return examAverage * 0.7 + regularScore * 0.3;
  };

  // 提交新课程
  const onFinish = async (values) => {
    const examScores = values.examScores.map(item => parseFloat(item.score));
    const regularScore = parseFloat(values.regularScore);
    const finalScore = calculateFinalScore(examScores, regularScore);

    try {
      await axios.post(`${API_BASE_URL}/courses`, {
        name: values.name,
        exam_scores: JSON.stringify(examScores),
        regular_score: regularScore,
        final_score: finalScore
      });
      
      form.resetFields();
      fetchCourses();
      fetchAverageGPA();
    } catch (error) {
      console.error('Error adding course:', error);
    }
  };

  const columns = [
    {
      title: '课程名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '考试成绩',
      dataIndex: 'exam_scores',
      key: 'exam_scores',
      render: (scores) => {
        const scoreArray = JSON.parse(scores);
        return scoreArray.map((score, index) => (
          <span key={index}>{score}{index < scoreArray.length - 1 ? ', ' : ''}</span>
        ));
      }
    },
    {
      title: '平时成绩',
      dataIndex: 'regular_score',
      key: 'regular_score',
    },
    {
      title: '最终成绩',
      dataIndex: 'final_score',
      key: 'final_score',
      render: (score) => score.toFixed(2),
    },
    {
      title: 'GPA',
      dataIndex: 'gpa',
      key: 'gpa',
      render: (gpa) => gpa.toFixed(2),
    }
  ];

  return (
    <Layout className="layout" style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 50px' }}>
        <Title level={2} style={{ margin: '16px 0' }}>GPA 计算器</Title>
      </Header>
      <Content style={{ padding: '50px' }}>
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="添加新课程">
              <Form
                form={form}
                name="course_form"
                onFinish={onFinish}
                autoComplete="off"
              >
                <Form.Item
                  name="name"
                  label="课程名称"
                  rules={[{ required: true, message: '请输入课程名称' }]}
                >
                  <Input />
                </Form.Item>

                <Form.List name="examScores">
                  {(fields, { add, remove }) => (
                    <>
                      {fields.map(({ key, name, ...restField }) => (
                        <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                          <Form.Item
                            {...restField}
                            name={[name, 'score']}
                            rules={[{ required: true, message: '请输入考试成绩' }]}
                          >
                            <InputNumber min={0} max={100} placeholder="考试成绩" />
                          </Form.Item>
                          <MinusCircleOutlined onClick={() => remove(name)} />
                        </Space>
                      ))}
                      <Form.Item>
                        <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                          添加考试成绩
                        </Button>
                      </Form.Item>
                    </>
                  )}
                </Form.List>

                <Form.Item
                  name="regularScore"
                  label="平时成绩"
                  rules={[{ required: true, message: '请输入平时成绩' }]}
                >
                  <InputNumber min={0} max={100} />
                </Form.Item>

                <Form.Item>
                  <Button type="primary" htmlType="submit">
                    提交
                  </Button>
                </Form.Item>
              </Form>
            </Card>
          </Col>

          <Col span={24}>
            <Card title="课程成绩列表">
              <Table columns={columns} dataSource={courses} rowKey="id" />
            </Card>
          </Col>

          <Col span={24}>
            <Card>
              <Title level={3}>总体平均学分绩点 (GPA): {averageGPA.toFixed(2)}</Title>
            </Card>
          </Col>
        </Row>
      </Content>
    </Layout>
  );
}

export default App;
