const { WebSocketServer } = require('ws');
const { recognizeWebmBuffer } = require('../services/attendancePythonClient');
const { mapPythonRecognizeToKioskPayload } = require('../services/kioskRecognitionService');
const { validateKioskCredential } = require('../services/kioskKeyAuthService');

const KIOSK_WS_PATH = '/api/kiosk/ws';

/**
 * WebSocket /api/kiosk/ws — JSON auth rồi gửi chunk WebM nhị phân.
 * noServer + chỉ handleUpgrade đúng path — tránh ws abort upgrade của Socket.IO (/socket.io/).
 */
function initKioskWs(httpServer) {
  const wss = new WebSocketServer({ noServer: true });

  httpServer.on('upgrade', (request, socket, head) => {
    try {
      const host = request.headers.host || 'localhost';
      const pathname = new URL(request.url, `http://${host}`).pathname;
      if (pathname !== KIOSK_WS_PATH) return;
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } catch {
      socket.destroy();
    }
  });

  wss.on('connection', (ws) => {
    let authenticated = false;
    let processing = false;

    ws.on('message', async (data, isBinary) => {
      if (!isBinary) {
        if (authenticated) return;
        try {
          const msg = JSON.parse(data.toString());
          if (msg.type !== 'auth' || !msg.key) {
            ws.close(4001, 'Unauthorized');
            return;
          }
          const result = await validateKioskCredential(msg.key);
          if (!result.ok) {
            ws.close(4001, 'Unauthorized');
            return;
          }
          authenticated = true;
          ws.send(JSON.stringify({ type: 'auth_ok' }));
          return;
        } catch (_) {
          ws.close(4001, 'Unauthorized');
          return;
        }
      }

      if (!authenticated) {
        ws.close(4001, 'Unauthorized');
        return;
      }

      if (processing) return;
      const buf = Buffer.isBuffer(data) ? data : Buffer.from(data);
      if (buf.length < 32) return;

      const hasEbml =
        buf.length >= 4 &&
        buf[0] === 0x1a &&
        buf[1] === 0x45 &&
        buf[2] === 0xdf &&
        buf[3] === 0xa3;
      if (!hasEbml) return;

      processing = true;
      try {
        const py = await recognizeWebmBuffer(buf);
        const result = await mapPythonRecognizeToKioskPayload(py);
        if (ws.readyState === 1) {
          ws.send(JSON.stringify({ type: 'recognize', ...result }));
        }
      } catch (e) {
        if (ws.readyState === 1) {
          ws.send(
            JSON.stringify({
              type: 'error',
              message: e.message || 'Lỗi xử lý',
            })
          );
        }
      } finally {
        processing = false;
      }
    });
  });

  return wss;
}

module.exports = { initKioskWs };
