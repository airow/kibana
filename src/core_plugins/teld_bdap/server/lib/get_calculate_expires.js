export default (server) => {
  //const ttl = server.config().get('xpack.security.sessionTimeout');
  const ttl = 1000;
  return () => ttl && Date.now() + ttl;
};
