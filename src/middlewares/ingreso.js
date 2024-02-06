export const checkSession = (req, res, next) => {
    console.log('Checking session:', req.session);
  
    if (req.session && req.session.user) {
      req.logger.info('Session exists:', req.session.user);
      next();
    } else {
      req.logger.error('No session found, redirecting to /login');
      res.redirect("/login");
    }
  };
  export const checkAlreadyLoggedIn = (req, res, next) => {
    if (req.session && req.session.user) {
      req.logger.info("Usuario ya autenticado, redirigiendo a /profile");
      res.redirect("/profile");
    } else {
      req.logger.warn("Usuario no autenticado, procediendo...");
      next();
    }
  };