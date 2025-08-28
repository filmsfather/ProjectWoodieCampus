import React, { useState, useEffect } from 'react';
import { SubjectApi } from '../../services/subjectApi';
import type { Subject, CreateSubjectRequest, UpdateSubjectRequest } from '../../services/subjectApi';
import './SubjectManagement.css';

const SubjectManagement: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingSubject, setDeletingSubject] = useState<Subject | null>(null);

  // 폼 상태
  const [formData, setFormData] = useState<CreateSubjectRequest>({
    name: '',
    description: '',
    grade_level: '',
  });

  // 교과목 목록 조회
  const fetchSubjects = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await SubjectApi.getSubjects();
      setSubjects(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '교과목 목록을 불러올 수 없습니다');
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 교과목 목록 조회
  useEffect(() => {
    fetchSubjects();
  }, []);

  // 폼 입력 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  // 교과목 생성
  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await SubjectApi.createSubject(formData);
      setShowCreateModal(false);
      setFormData({ name: '', description: '', grade_level: '' });
      fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : '교과목 생성에 실패했습니다');
    }
  };

  // 교과목 수정
  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      await SubjectApi.updateSubject(editingSubject.id, formData);
      setShowEditModal(false);
      setEditingSubject(null);
      setFormData({ name: '', description: '', grade_level: '' });
      fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : '교과목 수정에 실패했습니다');
    }
  };

  // 교과목 삭제
  const handleDeleteSubject = async () => {
    if (!deletingSubject) return;

    try {
      await SubjectApi.deleteSubject(deletingSubject.id);
      setShowDeleteDialog(false);
      setDeletingSubject(null);
      fetchSubjects();
    } catch (err) {
      setError(err instanceof Error ? err.message : '교과목 삭제에 실패했습니다');
    }
  };

  // 수정 모달 열기
  const openEditModal = (subject: Subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      description: subject.description || '',
      grade_level: subject.grade_level || '',
    });
    setShowEditModal(true);
  };

  // 삭제 확인 다이얼로그 열기
  const openDeleteDialog = (subject: Subject) => {
    setDeletingSubject(subject);
    setShowDeleteDialog(true);
  };

  // 모달 닫기
  const closeModals = () => {
    setShowCreateModal(false);
    setShowEditModal(false);
    setShowDeleteDialog(false);
    setEditingSubject(null);
    setDeletingSubject(null);
    setFormData({ name: '', description: '', grade_level: '' });
    setError(null);
  };

  if (loading) {
    return (
      <div className="subject-management">
        <div className="loading">교과목 목록을 불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="subject-management">
      <div className="subject-header">
        <h2>교과목 관리</h2>
        <button 
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          새 교과목 추가
        </button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <div className="subjects-grid">
        {subjects.map((subject) => (
          <div key={subject.id} className="subject-card">
            <div className="subject-info">
              <h3>{subject.name}</h3>
              {subject.description && <p>{subject.description}</p>}
              {subject.grade_level && (
                <span className="grade-level">{subject.grade_level}</span>
              )}
              <div className="subject-meta">
                <span className="creator">
                  생성자: {subject.creator?.full_name || subject.creator?.username || '알 수 없음'}
                </span>
                <span className="created-date">
                  생성일: {new Date(subject.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="subject-actions">
              <button 
                className="btn-secondary"
                onClick={() => openEditModal(subject)}
              >
                수정
              </button>
              <button 
                className="btn-danger"
                onClick={() => openDeleteDialog(subject)}
              >
                삭제
              </button>
            </div>
          </div>
        ))}
      </div>

      {subjects.length === 0 && (
        <div className="empty-state">
          <p>등록된 교과목이 없습니다.</p>
          <button 
            className="btn-primary"
            onClick={() => setShowCreateModal(true)}
          >
            첫 번째 교과목 추가하기
          </button>
        </div>
      )}

      {/* 교과목 생성 모달 */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>새 교과목 추가</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleCreateSubject} className="modal-form">
              <div className="form-group">
                <label htmlFor="name">
                  교과목명 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="교과목명 입력"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="grade_level">학년</label>
                <select
                  id="grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                >
                  <option value="">학년 선택</option>
                  <option value="전체">전체</option>
                  <option value="초등학교">초등학교</option>
                  <option value="중학교">중학교</option>
                  <option value="고등학교">고등학교</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">설명</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="교과목에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModals}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  교과목 생성
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 교과목 수정 모달 */}
      {showEditModal && editingSubject && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>교과목 수정</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <form onSubmit={handleEditSubject} className="modal-form">
              <div className="form-group">
                <label htmlFor="edit-name">
                  교과목명 <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="교과목명 입력"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-grade_level">학년</label>
                <select
                  id="edit-grade_level"
                  name="grade_level"
                  value={formData.grade_level}
                  onChange={handleInputChange}
                >
                  <option value="">학년 선택</option>
                  <option value="전체">전체</option>
                  <option value="초등학교">초등학교</option>
                  <option value="중학교">중학교</option>
                  <option value="고등학교">고등학교</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-description">설명</label>
                <textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="교과목에 대한 설명을 입력하세요"
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModals}>
                  취소
                </button>
                <button type="submit" className="btn-primary">
                  교과목 수정
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 삭제 확인 다이얼로그 */}
      {showDeleteDialog && deletingSubject && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>교과목 삭제</h3>
              <button className="modal-close" onClick={closeModals}>×</button>
            </div>
            <div className="delete-dialog">
              <p>
                <strong>"{deletingSubject.name}"</strong> 교과목을 삭제하시겠습니까?
              </p>
              <p className="warning">
                이 작업은 되돌릴 수 없습니다.
              </p>
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={closeModals}>
                  취소
                </button>
                <button type="button" className="btn-danger" onClick={handleDeleteSubject}>
                  삭제
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectManagement;