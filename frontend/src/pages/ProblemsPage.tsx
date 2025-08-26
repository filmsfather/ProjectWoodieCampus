import React, { useState } from 'react';

interface Problem {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  subject: string;
  completed: boolean;
}

const ProblemsPage: React.FC = () => {
  const [problems] = useState<Problem[]>([
    {
      id: '1',
      title: '삼차방정식의 해',
      difficulty: 'medium',
      subject: '수학',
      completed: false,
    },
    {
      id: '2',
      title: '영어 문법 - 관계대명사',
      difficulty: 'easy',
      subject: '영어',
      completed: true,
    },
    {
      id: '3',
      title: '물리 - 뉴턴 법칙',
      difficulty: 'hard',
      subject: '물리',
      completed: false,
    },
  ]);

  const [filter, setFilter] = useState<string>('all');

  const filteredProblems = problems.filter(problem => {
    if (filter === 'completed') return problem.completed;
    if (filter === 'incomplete') return !problem.completed;
    return true;
  });

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return '';
    }
  };

  return (
    <div className="problems-page">
      <div className="problems-header">
        <h1>문제 목록</h1>
        <p>학습할 문제들을 선택하세요</p>
      </div>
      
      <div className="problems-controls">
        <div className="filter-buttons">
          <button 
            className={filter === 'all' ? 'active' : ''}
            onClick={() => setFilter('all')}
          >
            전체
          </button>
          <button 
            className={filter === 'incomplete' ? 'active' : ''}
            onClick={() => setFilter('incomplete')}
          >
            미완료
          </button>
          <button 
            className={filter === 'completed' ? 'active' : ''}
            onClick={() => setFilter('completed')}
          >
            완료
          </button>
        </div>
        
        <button className="add-problem-btn">
          새 문제 추가
        </button>
      </div>
      
      <div className="problems-grid">
        {filteredProblems.map(problem => (
          <div key={problem.id} className={`problem-card ${problem.completed ? 'completed' : ''}`}>
            <div className="problem-header">
              <h3>{problem.title}</h3>
              <span className={`difficulty-badge ${getDifficultyClass(problem.difficulty)}`}>
                {problem.difficulty}
              </span>
            </div>
            
            <div className="problem-info">
              <span className="subject">{problem.subject}</span>
              <span className={`status ${problem.completed ? 'completed' : 'pending'}`}>
                {problem.completed ? '완료' : '대기중'}
              </span>
            </div>
            
            <div className="problem-actions">
              <button className="btn-primary">
                {problem.completed ? '다시 풀기' : '문제 풀기'}
              </button>
              <button className="btn-secondary">상세보기</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProblemsPage;