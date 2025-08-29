import React, { useState, useEffect } from 'react';
import { WorkbookService, type Workbook, type Student, type StudentGroup, type TeacherClass } from '../services/workbookApi';

type AssignmentTargetType = 'individual' | 'group' | 'class';

interface WorkbookAssignmentModalProps {
  workbook: Workbook;
  onClose: () => void;
  onAssign?: (assignment: {
    targetType: AssignmentTargetType;
    targetIds: string[];
    scheduledFor?: string;
    dueDate?: string;
  }) => Promise<void>;
}

const WorkbookAssignmentModal: React.FC<WorkbookAssignmentModalProps> = ({
  workbook,
  onClose,
  onAssign
}) => {
  const [targetType, setTargetType] = useState<AssignmentTargetType>('class');
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [scheduledFor, setScheduledFor] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  
  // 데이터 상태
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<StudentGroup[]>([]);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  
  // 검색 및 필터링 상태
  const [studentSearch, setStudentSearch] = useState('');
  const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
  
  // 그룹 생성 모달 상태
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDescription, setNewGroupDescription] = useState('');
  
  // 반별 학생 목록 상태
  const [classStudents, setClassStudents] = useState<Record<string, Student[]>>({});
  const [loadingClassStudents, setLoadingClassStudents] = useState<Record<string, boolean>>({});
  const [showClassPreview, setShowClassPreview] = useState<Record<string, boolean>>({});

  // 데이터 로드
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        const [studentsData, groupsData, classesData] = await Promise.all([
          WorkbookService.getStudents(),
          WorkbookService.getStudentGroups(),
          WorkbookService.getTeacherClasses(),
        ]);

        setStudents(studentsData);
        setGroups(groupsData);
        setClasses(classesData);
      } catch (error) {
        console.error('데이터 로딩 실패:', error);
        alert('데이터를 불러오는데 실패했습니다. 다시 시도해주세요.');
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // 학생 검색 필터링
  useEffect(() => {
    if (!studentSearch.trim()) {
      setFilteredStudents(students);
    } else {
      const filtered = students.filter(student =>
        student.full_name?.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.username.toLowerCase().includes(studentSearch.toLowerCase()) ||
        student.class_name?.toLowerCase().includes(studentSearch.toLowerCase())
      );
      setFilteredStudents(filtered);
    }
  }, [students, studentSearch]);

  const handleStudentToggle = (studentId: string) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleGroupToggle = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleClassToggle = (classId: string) => {
    setSelectedClasses(prev =>
      prev.includes(classId)
        ? prev.filter(id => id !== classId)
        : [...prev, classId]
    );
  };

  // 반 학생 목록 로드
  const loadClassStudents = async (classId: string) => {
    if (classStudents[classId]) {
      // 이미 로드된 경우 미리보기만 토글
      setShowClassPreview(prev => ({
        ...prev,
        [classId]: !prev[classId]
      }));
      return;
    }

    setLoadingClassStudents(prev => ({ ...prev, [classId]: true }));
    try {
      const students = await WorkbookService.getStudentsByClass(classId);
      setClassStudents(prev => ({ ...prev, [classId]: students }));
      setShowClassPreview(prev => ({ ...prev, [classId]: true }));
    } catch (error) {
      console.error('반 학생 목록 로드 실패:', error);
      alert('반 학생 목록을 불러올 수 없습니다.');
    } finally {
      setLoadingClassStudents(prev => ({ ...prev, [classId]: false }));
    }
  };

  // 선택된 모든 학생 수 계산 (실제 학생 데이터 기반)
  const getActualSelectedCount = () => {
    switch (targetType) {
      case 'individual':
        return selectedStudents.length;
      case 'group':
        return groups
          .filter(group => selectedGroups.includes(group.id))
          .reduce((total, group) => total + group.student_count, 0);
      case 'class':
        let totalCount = 0;
        selectedClasses.forEach(classId => {
          if (classStudents[classId]) {
            // 실제 로드된 학생 수 사용 (비활성 학생 제외)
            totalCount += classStudents[classId].filter(student => student.id).length;
          } else {
            // 로드되지 않은 경우 예상 학생 수 사용
            const classInfo = classes.find(c => c.id === classId);
            totalCount += classInfo?.student_count || 0;
          }
        });
        return totalCount;
      default:
        return 0;
    }
  };

  const getSelectedCount = getActualSelectedCount;

  // 새 그룹 생성
  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      alert('그룹명을 입력해주세요.');
      return;
    }

    if (selectedStudents.length === 0) {
      alert('그룹에 포함할 학생을 선택해주세요.');
      return;
    }

    try {
      const newGroup = await WorkbookService.createStudentGroup({
        name: newGroupName.trim(),
        description: newGroupDescription.trim() || undefined,
        studentIds: selectedStudents,
      });

      // 그룹 목록에 추가
      setGroups(prev => [...prev, newGroup]);
      
      // 새로 생성된 그룹을 선택된 상태로 변경
      setSelectedGroups([newGroup.id]);
      setTargetType('group');
      
      // 모달 닫기 및 상태 초기화
      setShowGroupModal(false);
      setNewGroupName('');
      setNewGroupDescription('');
      
      alert('그룹이 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('그룹 생성 실패:', error);
      alert('그룹 생성에 실패했습니다. 다시 시도해주세요.');
    }
  };

  const handleSubmit = async () => {
    let targetIds: string[] = [];
    
    switch (targetType) {
      case 'individual':
        targetIds = selectedStudents;
        break;
      case 'group':
        targetIds = selectedGroups;
        break;
      case 'class':
        targetIds = selectedClasses;
        break;
    }

    if (targetIds.length === 0) {
      alert('배포 대상을 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      if (onAssign) {
        // 외부에서 제공된 핸들러 사용
        await onAssign({
          targetType,
          targetIds,
          scheduledFor: scheduledFor || undefined,
          dueDate: dueDate || undefined,
        });
      } else {
        // 내장된 API 호출
        await WorkbookService.assignWorkbook(workbook.id!, {
          targetType,
          targetIds,
          scheduledFor: scheduledFor || undefined,
          dueDate: dueDate || undefined,
        });
      }
      
      alert('문제집이 성공적으로 배포되었습니다.');
      onClose();
    } catch (error) {
      console.error('배포 실패:', error);
      alert('배포에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div 
        className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--color-border-light)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-2xl)'
        }}
      >
        {/* 헤더 */}
        <div 
          className="sticky top-0 z-10"
          style={{
            background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.05) 0%, rgba(255,255,255,0.95) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--color-border-light)',
            borderRadius: 'var(--radius-lg) var(--radius-lg) 0 0',
            padding: 'var(--space-6)'
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 style={{
                fontSize: 'var(--font-size-xl)',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-1)'
              }}>
                문제집 배포
              </h2>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: 'var(--font-size-sm)' 
              }}>
                "{workbook.title}" 문제집을 배포할 대상을 선택하세요
              </p>
            </div>
            <button
              onClick={onClose}
              className="transition-all duration-200 hover:scale-110 hover:bg-red-50"
              style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--color-text-secondary)',
                fontSize: 'var(--font-size-lg)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* 컨텐츠 */}
        <div style={{ padding: 'var(--space-6)' }}>
          {loadingData ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
              <p style={{ color: 'var(--color-text-secondary)' }}>데이터를 불러오는 중...</p>
            </div>
          ) : (
            <>
              {/* 배포 대상 타입 선택 */}
              <div className="mb-6">
                <label style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: 'var(--space-3)'
                }}>
                  배포 대상 선택
                </label>
                
                <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                  {[
                    { value: 'class', label: '반 전체', icon: '🏫' },
                    { value: 'group', label: '그룹', icon: '👥' },
                    { value: 'individual', label: '개별 학생', icon: '👤' }
                  ].map(option => (
                    <label
                      key={option.value}
                      className="flex-1 cursor-pointer transition-all duration-200 hover:scale-105"
                      style={{
                        background: targetType === option.value 
                          ? 'linear-gradient(135deg, #8b4513 0%, #654321 100%)'
                          : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(245,245,240,0.6) 100%)',
                        color: targetType === option.value ? 'white' : 'var(--color-text-primary)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-4)',
                        textAlign: 'center'
                      }}
                    >
                      <input
                        type="radio"
                        name="targetType"
                        value={option.value}
                        checked={targetType === option.value}
                        onChange={(e) => setTargetType(e.target.value as AssignmentTargetType)}
                        style={{ display: 'none' }}
                      />
                      <div style={{ fontSize: 'var(--font-size-lg)', marginBottom: 'var(--space-1)' }}>
                        {option.icon}
                      </div>
                      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: '500' }}>
                        {option.label}
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* 대상 선택 영역 */}
              <div className="mb-6">
                {targetType === 'class' && (
                  <div>
                    <label style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: 'var(--space-3)'
                    }}>
                      반 선택
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {classes.map(cls => (
                        <div key={cls.id}>
                          <label
                            className="flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-brown-50"
                            style={{
                              background: selectedClasses.includes(cls.id)
                                ? 'rgba(139, 69, 19, 0.1)'
                                : 'rgba(255,255,255,0.7)',
                              border: `1px solid ${selectedClasses.includes(cls.id) ? 'rgba(139, 69, 19, 0.3)' : 'var(--color-border-light)'}`,
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedClasses.includes(cls.id)}
                              onChange={() => handleClassToggle(cls.id)}
                              style={{ 
                                marginRight: 'var(--space-3)',
                                accentColor: '#8b4513'
                              }}
                            />
                            <div className="flex-1">
                              <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                                {cls.name}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                학생 {classStudents[cls.id] 
                                  ? `${classStudents[cls.id].length}명 (확인됨)` 
                                  : `${cls.student_count}명 (예상)`}
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                loadClassStudents(cls.id);
                              }}
                              className="ml-2 text-sm text-blue-600 hover:text-blue-800 underline"
                              style={{ fontSize: 'var(--font-size-xs)' }}
                              disabled={loadingClassStudents[cls.id]}
                            >
                              {loadingClassStudents[cls.id] 
                                ? '로딩...' 
                                : showClassPreview[cls.id] 
                                ? '숨기기' 
                                : '미리보기'}
                            </button>
                          </label>

                          {/* 학생 목록 미리보기 */}
                          {showClassPreview[cls.id] && classStudents[cls.id] && (
                            <div
                              style={{
                                marginTop: 'var(--space-2)',
                                marginLeft: 'var(--space-6)',
                                padding: 'var(--space-3)',
                                background: 'rgba(139, 69, 19, 0.05)',
                                border: '1px solid rgba(139, 69, 19, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                maxHeight: '150px',
                                overflowY: 'auto'
                              }}
                            >
                              <div style={{
                                fontSize: 'var(--font-size-xs)',
                                fontWeight: '600',
                                color: 'var(--color-text-secondary)',
                                marginBottom: 'var(--space-2)'
                              }}>
                                포함될 학생 목록 ({classStudents[cls.id].length}명):
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
                                {classStudents[cls.id].map(student => (
                                  <div
                                    key={student.id}
                                    style={{
                                      fontSize: 'var(--font-size-xs)',
                                      color: 'var(--color-text-primary)',
                                      padding: 'var(--space-1) var(--space-2)',
                                      background: 'rgba(255,255,255,0.7)',
                                      borderRadius: 'var(--radius-sm)',
                                      display: 'flex',
                                      justifyContent: 'space-between'
                                    }}
                                  >
                                    <span>{student.full_name || student.username}</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>
                                      @{student.username}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {targetType === 'group' && (
                  <div>
                    <label style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '600',
                      color: 'var(--color-text-secondary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      display: 'block',
                      marginBottom: 'var(--space-3)'
                    }}>
                      그룹 선택
                    </label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                      {groups.map(group => (
                        <label
                          key={group.id}
                          className="flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-brown-50"
                          style={{
                            background: selectedGroups.includes(group.id)
                              ? 'rgba(139, 69, 19, 0.1)'
                              : 'rgba(255,255,255,0.7)',
                            border: `1px solid ${selectedGroups.includes(group.id) ? 'rgba(139, 69, 19, 0.3)' : 'var(--color-border-light)'}`,
                            borderRadius: 'var(--radius-md)'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedGroups.includes(group.id)}
                            onChange={() => handleGroupToggle(group.id)}
                            style={{ 
                              marginRight: 'var(--space-3)',
                              accentColor: '#8b4513'
                            }}
                          />
                          <div className="flex-1">
                            <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                              {group.name}
                            </div>
                            <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                              {group.description} • 학생 {group.student_count}명
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {targetType === 'individual' && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <label style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: 'var(--color-text-secondary)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        학생 선택
                      </label>
                      <button
                        onClick={() => setShowGroupModal(true)}
                        className="text-sm text-blue-600 hover:text-blue-800 underline"
                        style={{ fontSize: 'var(--font-size-sm)' }}
                      >
                        선택한 학생으로 그룹 만들기
                      </button>
                    </div>
                    
                    {/* 검색 입력 */}
                    <input
                      type="text"
                      placeholder="학생 이름, 아이디, 반으로 검색..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-2) var(--space-3)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        marginBottom: 'var(--space-3)',
                        background: 'rgba(255,255,255,0.8)'
                      }}
                    />
                    
                    <div 
                      style={{ 
                        maxHeight: '200px', 
                        overflowY: 'auto',
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: 'var(--space-2)' 
                      }}
                    >
                      {filteredStudents.length === 0 ? (
                        <div style={{ 
                          textAlign: 'center', 
                          padding: 'var(--space-4)', 
                          color: 'var(--color-text-secondary)' 
                        }}>
                          {studentSearch.trim() ? '검색 결과가 없습니다.' : '학생이 없습니다.'}
                        </div>
                      ) : (
                        filteredStudents.map(student => (
                          <label
                            key={student.id}
                            className="flex items-center p-3 cursor-pointer transition-all duration-200 hover:bg-brown-50"
                            style={{
                              background: selectedStudents.includes(student.id)
                                ? 'rgba(139, 69, 19, 0.1)'
                                : 'rgba(255,255,255,0.7)',
                              border: `1px solid ${selectedStudents.includes(student.id) ? 'rgba(139, 69, 19, 0.3)' : 'var(--color-border-light)'}`,
                              borderRadius: 'var(--radius-md)'
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={selectedStudents.includes(student.id)}
                              onChange={() => handleStudentToggle(student.id)}
                              style={{ 
                                marginRight: 'var(--space-3)',
                                accentColor: '#8b4513'
                              }}
                            />
                            <div className="flex-1">
                              <div style={{ fontWeight: '500', color: 'var(--color-text-primary)' }}>
                                {student.full_name || student.username}
                              </div>
                              <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
                                {student.class_name} • @{student.username}
                              </div>
                            </div>
                          </label>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 일정 설정 */}
              <div className="mb-6">
                <label style={{
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  display: 'block',
                  marginBottom: 'var(--space-3)'
                }}>
                  배포 일정 (선택사항)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)' }}>
                  <div>
                    <label style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-text-primary)',
                      display: 'block',
                      marginBottom: 'var(--space-2)'
                    }}>
                      배포 시작일
                    </label>
                    <input
                      type="datetime-local"
                      value={scheduledFor}
                      onChange={(e) => setScheduledFor(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        background: 'rgba(255,255,255,0.8)'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{ 
                      fontSize: 'var(--font-size-sm)', 
                      color: 'var(--color-text-primary)',
                      display: 'block',
                      marginBottom: 'var(--space-2)'
                    }}>
                      마감일
                    </label>
                    <input
                      type="datetime-local"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: 'var(--space-3)',
                        border: '1px solid var(--color-border-light)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: 'var(--font-size-sm)',
                        background: 'rgba(255,255,255,0.8)'
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* 선택 요약 */}
              {getSelectedCount() > 0 && (
                <div 
                  className="mb-6 p-4"
                  style={{
                    background: 'linear-gradient(135deg, rgba(139, 69, 19, 0.1) 0%, rgba(255,255,255,0.8) 100%)',
                    border: '1px solid rgba(139, 69, 19, 0.2)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <h4 style={{
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: '600',
                    color: 'var(--color-text-primary)',
                    marginBottom: 'var(--space-2)'
                  }}>
                    배포 대상 요약
                  </h4>
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: 'var(--font-size-sm)',
                    margin: 0
                  }}>
                    총 <strong style={{ color: '#8b4513' }}>{getSelectedCount()}명</strong>의 학생에게 배포됩니다
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* 푸터 */}
        <div 
          className="sticky bottom-0"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderTop: '1px solid var(--color-border-light)',
            borderRadius: '0 0 var(--radius-lg) var(--radius-lg)',
            padding: 'var(--space-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <button
            onClick={onClose}
            className="transition-all duration-200 hover:scale-105 active:scale-95"
            style={{
              background: 'rgba(255,255,255,0.8)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-5)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '500',
              color: 'var(--color-text-primary)',
              cursor: 'pointer'
            }}
          >
            취소
          </button>
          
          <button
            onClick={handleSubmit}
            disabled={loading || getSelectedCount() === 0}
            className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            style={{
              background: loading || getSelectedCount() === 0
                ? 'rgba(139, 69, 19, 0.5)'
                : 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
              color: 'white',
              border: 'none',
              borderRadius: 'var(--radius-md)',
              padding: 'var(--space-3) var(--space-5)',
              fontSize: 'var(--font-size-sm)',
              fontWeight: '600',
              cursor: loading || getSelectedCount() === 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)'
            }}
          >
            {loading && (
              <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
            )}
            {loading ? '배포 중...' : `배포하기 (${getSelectedCount()}명)`}
          </button>
        </div>
      </div>

      {/* 그룹 생성 모달 */}
      {showGroupModal && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)'
          }}
          onClick={(e) => e.target === e.currentTarget && setShowGroupModal(false)}
        >
          <div 
            className="relative max-w-md w-full mx-4"
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(245,245,240,0.9) 100%)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid var(--color-border-light)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: 'var(--shadow-2xl)'
            }}
          >
            {/* 헤더 */}
            <div style={{ padding: 'var(--space-6)', borderBottom: '1px solid var(--color-border-light)' }}>
              <h3 style={{
                fontSize: 'var(--font-size-lg)',
                fontWeight: '600',
                color: 'var(--color-text-primary)',
                marginBottom: 'var(--space-1)'
              }}>
                새 그룹 생성
              </h3>
              <p style={{ 
                color: 'var(--color-text-secondary)', 
                fontSize: 'var(--font-size-sm)',
                margin: 0
              }}>
                선택된 {selectedStudents.length}명의 학생으로 그룹을 만듭니다
              </p>
            </div>

            {/* 내용 */}
            <div style={{ padding: 'var(--space-6)' }}>
              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: '500', 
                  color: 'var(--color-text-primary)',
                  display: 'block',
                  marginBottom: 'var(--space-2)'
                }}>
                  그룹명 *
                </label>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  placeholder="예: 수학 우수반"
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    background: 'rgba(255,255,255,0.8)'
                  }}
                />
              </div>

              <div style={{ marginBottom: 'var(--space-4)' }}>
                <label style={{ 
                  fontSize: 'var(--font-size-sm)', 
                  fontWeight: '500', 
                  color: 'var(--color-text-primary)',
                  display: 'block',
                  marginBottom: 'var(--space-2)'
                }}>
                  설명 (선택사항)
                </label>
                <textarea
                  value={newGroupDescription}
                  onChange={(e) => setNewGroupDescription(e.target.value)}
                  placeholder="그룹에 대한 간단한 설명을 입력하세요"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: 'var(--space-3)',
                    border: '1px solid var(--color-border-light)',
                    borderRadius: 'var(--radius-md)',
                    fontSize: 'var(--font-size-sm)',
                    background: 'rgba(255,255,255,0.8)',
                    resize: 'vertical',
                    minHeight: '80px'
                  }}
                />
              </div>
            </div>

            {/* 푸터 */}
            <div 
              style={{
                padding: 'var(--space-6)',
                borderTop: '1px solid var(--color-border-light)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <button
                onClick={() => setShowGroupModal(false)}
                className="transition-all duration-200 hover:scale-105 active:scale-95"
                style={{
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid var(--color-border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '500',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer'
                }}
              >
                취소
              </button>
              
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || selectedStudents.length === 0}
                className="transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                style={{
                  background: (!newGroupName.trim() || selectedStudents.length === 0)
                    ? 'rgba(139, 69, 19, 0.5)'
                    : 'linear-gradient(135deg, #8b4513 0%, #654321 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-3) var(--space-4)',
                  fontSize: 'var(--font-size-sm)',
                  fontWeight: '600',
                  cursor: (!newGroupName.trim() || selectedStudents.length === 0) ? 'not-allowed' : 'pointer'
                }}
              >
                그룹 생성
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkbookAssignmentModal;