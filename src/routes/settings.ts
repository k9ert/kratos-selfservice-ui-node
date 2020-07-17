import { NextFunction, Request, Response } from 'express'
import config, { logger } from '../config'
import { CommonApi } from '@oryd/kratos-client'

const commonApi = new CommonApi(config.kratos.admin)

const settingsHandler = (req: Request, res: Response, next: NextFunction) => {
  const request = req.query.request
  // The request is used to identify the account settings request and
  // return data like the csrf_token and so on.
  if (!request) {
    logger.info('No request found in URL, initializing settings flow.')
    res.redirect(`${config.kratos.browser}/self-service/browser/flows/settings`)
    return
  }

  commonApi
    .getSelfServiceBrowserSettingsRequest(request)
    .then(({ body, response }) => {
      if (
        response.statusCode == 404 ||
        response.statusCode == 410 ||
        response.statusCode == 403
      ) {
        res.redirect(
          `${config.kratos.browser}/self-service/browser/flows/settings`
        )
        return
      } else if (response.statusCode != 200) {
        return Promise.reject(body)
      }

      return Promise.resolve(body)
    })
    .then(request => {
      const methodConfig = (key: string) => request?.methods[key]?.config

      if (request) {
        res.render('settings', {
          ...request,
          password: methodConfig('password'),
          profile: methodConfig('profile'),
          oidc: methodConfig('oidc'),
        })
        return
      }

      return Promise.reject(
        'Expected self service settings request to be defined.'
      )
    })
    .catch(next)
}

export default settingsHandler
