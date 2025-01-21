from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# 配置数据库
DATABASE_URL = os.getenv('DATABASE_URL', 'sqlite:///gpa.db')
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = DATABASE_URL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 数据模型
class Course(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    exam_scores = db.Column(db.String(200))  # 存储为JSON字符串
    regular_score = db.Column(db.Float)
    final_score = db.Column(db.Float)
    gpa = db.Column(db.Float)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# GPA计算规则
def calculate_gpa(score):
    if score >= 90:
        return 4.0
    elif score >= 85:
        return 3.7
    elif score >= 82:
        return 3.3
    elif score >= 78:
        return 3.0
    elif score >= 75:
        return 2.7
    elif score >= 72:
        return 2.3
    elif score >= 68:
        return 2.0
    elif score >= 64:
        return 1.5
    elif score >= 60:
        return 1.0
    else:
        return 0.0

@app.route('/api/courses', methods=['GET'])
def get_courses():
    courses = Course.query.order_by(Course.final_score.desc()).all()
    return jsonify([{
        'id': course.id,
        'name': course.name,
        'exam_scores': course.exam_scores,
        'regular_score': course.regular_score,
        'final_score': course.final_score,
        'gpa': course.gpa
    } for course in courses])

@app.route('/api/courses', methods=['POST'])
def add_course():
    data = request.json
    course = Course(
        name=data['name'],
        exam_scores=data['exam_scores'],
        regular_score=data['regular_score'],
        final_score=data['final_score'],
        gpa=calculate_gpa(data['final_score'])
    )
    db.session.add(course)
    db.session.commit()
    return jsonify({'message': 'Course added successfully'})

@app.route('/api/courses/<int:id>', methods=['PUT'])
def update_course(id):
    course = Course.query.get_or_404(id)
    data = request.json
    course.name = data['name']
    course.exam_scores = data['exam_scores']
    course.regular_score = data['regular_score']
    course.final_score = data['final_score']
    course.gpa = calculate_gpa(data['final_score'])
    db.session.commit()
    return jsonify({'message': 'Course updated successfully'})

@app.route('/api/courses/<int:id>', methods=['DELETE'])
def delete_course(id):
    course = Course.query.get_or_404(id)
    db.session.delete(course)
    db.session.commit()
    return jsonify({'message': 'Course deleted successfully'})

@app.route('/api/gpa/average', methods=['GET'])
def get_average_gpa():
    courses = Course.query.all()
    if not courses:
        return jsonify({'average_gpa': 0})
    total_gpa = sum(course.gpa for course in courses)
    average_gpa = total_gpa / len(courses)
    return jsonify({'average_gpa': round(average_gpa, 2)})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    port = int(os.getenv('PORT', 8000))
    app.run(debug=False, host='0.0.0.0', port=port)
