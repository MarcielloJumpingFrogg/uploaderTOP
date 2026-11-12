import { passport } from '../../config/passport';
import type { Express } from 'express';
import { signUpController } from '../controllers/signUpController';
import { accountController } from '../controllers/accountController';
import customErrorContainer from '../customErrors/customErrorContainer';
import fs from 'fs';
import { avatarUploader } from '../controllers/avatarUploader';
import { fileUploader } from '../controllers/uploaderController';
import { folderVisualizer } from '../controllers/folderVisualizer';
import { newFolderController } from '../controllers/newFolderController';
import { getAvatar } from '../supabaseFn/getAvatar';
import { fileDeleteController } from '../controllers/fileDeleteController';
import { renameController } from '../controllers/renameController';
import { downloadController } from '../controllers/downloadController';
import { shareCreatorController } from '../controllers/shareCreatorController';
import { addSharedFileCtrl } from '../controllers/addSharedFileCtrl';
import logger from '../../config/logger';

async function routes(app: Express) {
  app.get('/', (req, res) => {
    if (req.user) {
      res.redirect('/account');
    } else {
      res.redirect('/login');
    }
  });

  app.get('/login', (_req: any, res) => {
    res.status(customErrorContainer.getErrorCode()).render('login', {
      title: 'Login',
      errors: customErrorContainer.getErrorList(),
    });
  });

  app.post(
    '/login',
    passport.authenticate('local', {
      successRedirect: '/account',
      failureRedirect: '/login?error=Invalid+credentials',
      failureMessage: true,
    }),
  );

  app.get('/signUp', (_req, res) => {
    res.render('signUp');
  });

  app.get('/log-out', (req, res, next) => {
    customErrorContainer.resetError();
    req.logout((err: string) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  });

  app.post('/signUp', signUpController);

  app.get('/account', accountController);

  app.get('/account/:owned/:folderId', folderVisualizer);

  app.post('/account/avatar', avatarUploader);

  app.get('/avatar', async (req: any, res) => {
    if (req.user.id === undefined) {
      logger.error('NO REQ.USER.ID');
    } else {
      const avatar = await getAvatar(req.user.id);
      res.redirect(avatar);
    }
  });

  app.get('/img/:imageName', async (req, res) => {
    const imageName = req.params.imageName;
    console.log('imageName: ', imageName);
    const avatarLink = await getAvatar(imageName);
    const readStream = fs.createReadStream(avatarLink || '');
    readStream.pipe(res);
  });

  app.post('/account/file', fileUploader);

  app.post('/account/newFolder', newFolderController);

  app.post('/account/delete', fileDeleteController);

  app.post('/account/rename', renameController);

  app.post('/account/download', downloadController);

  app.get('/share/add/:shareId', addSharedFileCtrl);

  app.post('/share/create', shareCreatorController);
  app.get('/share/create', async (req, res) => {
    res.redirect('/');
  });

  app.use((req, res, next) => {
    res.status(404);

    if (req.accepts('html')) {
      res.render('404', { url: req.url });
      return;
    }

    if (req.accepts('json')) {
      res.json({ error: 'Not found' });
      return;
    }

    res.type('txt').send('Not found');
  });
}

export { routes };
