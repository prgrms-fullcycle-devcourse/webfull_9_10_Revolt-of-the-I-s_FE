/**
 * useTeams 커스텀 훅
 * @description 팀 데이터(Team), 티켓(Ticket), 활동 로그(Log)의 상태 관리 및 비즈니스 로직을 총괄합니다.
 * @param currentUser 현재 접속한 유저 정보 (로그 기록 및 권한 확인용)
 */
import { useState, useMemo } from 'react'
import type { Team, Ticket, CurrentUser } from '../types'
import { INITIAL_TEAM } from '../utils/constants'
import { formatLogTime } from '../utils/format'

// 상태 관리 - 팀 리스트 및 참여중인 팀 ID
export const useTeams = (currentUser: CurrentUser | null) => {
  const [teams, setTeams] = useState<Team[]>([INITIAL_TEAM])
  const [activeTeamId, setActiveTeamId] = useState<string | null>(null)

  // 현재 활성화된 팀 객체를 실시간으로 찾아 유지
  const activeTeam = useMemo(() => {
    return teams.find((t) => t.id === activeTeamId) ?? null
  }, [teams, activeTeamId])

  // 현재 유저가 참여 중인 팀 목록
  const joinedTeams = useMemo(() => {
    if (!currentUser) return []
    return teams.filter((team) =>
      team.members.some((member) => member.name === currentUser.name)
    )
  }, [teams, currentUser])

  // 현재 유저가 아직 참여하지 않은 팀 목록
  const availableTeams = useMemo(() => {
    if (!currentUser) return teams
    return teams.filter(
      (team) => !team.members.some((member) => member.name === currentUser.name)
    )
  }, [teams, currentUser])

  /**
   * [핵심 함수] addLog: 활동 로그 생성
   * @param ticketId 관련 티켓 번호 (시스템 로그일 경우 0)
   * @param userName 작업 수행자 이름
   * @param action 발생한 동작 설명
   * @param type 로그의 성격 (default: 일반, info: 정보/변경, success: 완료, error: 반려/에러)
   */
  const addLog = (
    ticketId: number,
    userName: string,
    action: string,
    type: 'default' | 'info' | 'success' | 'error' = 'default'
  ) => {
    if (!activeTeamId) return

    const time = formatLogTime()

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              // 최신 로그를 맨 위로 올리고, 성능을 위해 최근 20개만 유지
              logs: [
                { id: Date.now(), ticketId, user: userName, action, time, type },
                ...t.logs,
              ].slice(0, 20),
            }
          : t
      )
    )
  }

  /**
   * [기능] updateTicketStatus: 티켓의 진행 상태 변경
   * @param id 티켓 ID
   * @param newStatus 변경될 상태 (todo, doing, done 등)
   * @param isReject 반려 여부 (true일 경우 빨간색 로그 생성)
   */
  const updateTicketStatus = (
    id: number,
    newStatus: string,
    isReject = false
  ) => {
    if (!activeTeamId || !currentUser) return

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              tickets: t.tickets.map((tk) =>
                tk.id === id ? { ...tk, status: newStatus } : tk
              ),
            }
          : t
      )
    )

    // 상태 변화에 따른 로그 타입 결정
    let logType: 'info' | 'success' | 'error' = 'info'
    if (isReject) logType = 'error'
    else if (newStatus === 'done') logType = 'success'

    addLog(
      id,
      currentUser.name,
      isReject ? '반려 및 재요청' : `상태 변경: ${newStatus}`,
      logType
    )
  }

  /**
   * [기능] handleCreateTicket: 새로운 업무 요청(티켓) 발행
   */
  const handleCreateTicket = (
    title: string,
    content: string,
    worker: string
  ) => {
    if (!currentUser || !activeTeamId) {
      console.error('생성 실패: 유저 정보나 활성화된 팀 ID가 없습니다.')
      console.log('체크:', { currentUser, activeTeamId })
      return
    }

    const newTicket: Ticket = {
      id: Date.now(),
      title,
      content,
      requester: currentUser.name,
      worker,
      status: 'Todo',
      createdAt: new Date()
        .toLocaleString('ko-KR', { hour12: false })
        .slice(0, -3),
      comments: [],
    }

    setTeams((prevTeams) =>
      prevTeams.map((team) =>
        team.id === activeTeamId
          ? { ...team, tickets: [newTicket, ...team.tickets] }
          : team
      )
    )

    addLog(newTicket.id, currentUser.name, `새 업무 발행: ${title}`, 'default')
  }

  /**
   * [기능] handleAddComment: 티켓 내 댓글 추가
   */
  const handleAddComment = (ticketId: number, text: string) => {
    if (!text || !currentUser || !activeTeamId) return

    setTeams((prev) =>
      prev.map((t) =>
        t.id === activeTeamId
          ? {
              ...t,
              tickets: t.tickets.map((tk) =>
                tk.id === ticketId
                  ? {
                      ...tk,
                      comments: [
                        ...tk.comments,
                        {
                          id: Date.now(),
                          user: currentUser.name,
                          text,
                          time: new Date().toLocaleTimeString('ko-KR', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: false,
                          }),
                        },
                      ],
                    }
                  : tk
              ),
            }
          : t
      )
    )

    addLog(ticketId, currentUser.name, '댓글 작성', 'info')
  }

  /**
   * [기능] leaveTeam: 현재 유저를 팀 멤버 목록에서 제거
   */
  const leaveTeam = (teamId: string) => {
    if (!currentUser) return

    setTeams((prev) =>
      prev.map((team) =>
        team.id === teamId
          ? {
              ...team,
              members: team.members.filter(
                (member) => member.name !== currentUser.name
              ),
            }
          : team
      )
    )

    if (activeTeamId === teamId) {
      setActiveTeamId(null)
    }
  }

  // 외부 컴포넌트에서 사용할 데이터와 함수 반환
  return {
    currentUser,
    teams,
    setTeams,
    activeTeamId,
    setActiveTeamId,
    activeTeam,
    joinedTeams,
    availableTeams,
    addLog,
    updateTicketStatus,
    handleCreateTicket,
    handleAddComment,
    leaveTeam,
  }
}