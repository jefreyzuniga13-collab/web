notificationsConnection.on('AssignmentRequested', payload => setShowAssignedModal(payload.conversationId));
notificationsConnection.on('AssignmentResponse', payload => setShowAdminResponseModal(payload));
notificationsConnection.on('AssignmentForced', payload => setShowForcedModal(payload));
notificationsConnection.on('AssignmentForcedAdmin', payload => setShowForcedAdminModal(payload));