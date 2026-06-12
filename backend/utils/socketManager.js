let io = null;

module.exports = {
  init: (socketIoInstance) => {
    io = socketIoInstance;
    return io;
  },
  getIO: () => {
    return io;
  },
  emitLog: (logDoc) => {
    if (io) {
      io.to('admin_channel').emit('live_log', logDoc);
      console.log(`📡 Broadcasted live log [${logDoc.type}] to Admin Channel`);
    }
  },
  emitCrash: (crashDoc) => {
    if (io) {
      io.to('admin_channel').emit('live_crash', crashDoc);
      console.log(`📡 Broadcasted live crash log to Admin Channel`);
    }
  }
};
