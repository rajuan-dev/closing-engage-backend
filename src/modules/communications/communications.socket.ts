import type http from 'http';
import { Server } from 'socket.io';

import { logger } from '../../core/logger';
import { verifyAuthToken } from '../auth/auth.service';
import { getThreadMessages, sendMessage, type CommunicationAuth } from './communications.service';

let ioInstance: Server | null = null;

const socketAuthFromToken = (token: string): CommunicationAuth => {
  const payload = verifyAuthToken(token);
  return {
    id: payload.role === 'company' ? payload.companyId ?? payload.sub : payload.sub,
    email: payload.email,
    role: payload.role,
  };
};

export const initializeCommunicationSocket = (server: http.Server) => {
  const io = new Server(server, {
    cors: {
      origin: true,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        typeof socket.handshake.auth.token === 'string'
          ? socket.handshake.auth.token
          : socket.handshake.headers.authorization?.toString().replace(/^Bearer\s+/i, '');

      if (!token) {
        next(new Error('Authorization token is required'));
        return;
      }

      socket.data.auth = socketAuthFromToken(token);
      next();
    } catch (error) {
      next(error instanceof Error ? error : new Error('Socket authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    const auth = socket.data.auth as CommunicationAuth;

    socket.on('communications:join-order', async (orderNumber: string, ack?: (payload: unknown) => void) => {
      try {
        const result = await getThreadMessages(auth, orderNumber);
        socket.join(`thread:${result.thread.id}`);
        ack?.({ success: true, data: result });
      } catch (error) {
        logger.warn({ err: error, orderNumber, role: auth.role, userId: auth.id }, 'Socket join order chat failed');
        ack?.({ success: false, message: error instanceof Error ? error.message : 'Unable to join order chat' });
      }
    });

    socket.on(
      'communications:send-message',
      async (payload: { orderNumber?: string; body?: string }, ack?: (payload: unknown) => void) => {
        try {
          const result = await sendMessage(auth, {
            orderNumber: payload.orderNumber ?? '',
            body: payload.body ?? '',
          });
          io.to(`thread:${result.thread.id}`).emit('communications:message', result);
          ack?.({ success: true, data: result });
        } catch (error) {
          logger.warn({ err: error, role: auth.role, userId: auth.id }, 'Socket send order message failed');
          ack?.({ success: false, message: error instanceof Error ? error.message : 'Unable to send message' });
        }
      },
    );
  });

  ioInstance = io;
  return io;
};

export const getCommunicationSocket = () => ioInstance;

export const emitCommunicationMessage = (result: Awaited<ReturnType<typeof sendMessage>>) => {
  ioInstance?.to(`thread:${result.thread.id}`).emit('communications:message', result);
};
