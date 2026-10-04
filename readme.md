# SmartMail

a simple mailserver and calendar server with a webmail interface

## demo

https://mail.qplus.cloud

username: somtesting/admin
password: test

## features

- webmail interface
- calendar interface
- admin interface

## Optional communication-services integration

Set `COMMUNICATIONSERVICES_URL` in the SmartMail server environment to enable meeting links on calendar events. SmartMail forwards the authenticated Keystone session and tenant ID to that configured service for meeting creation, access-policy updates, and session-token retrieval.

Calendar event endpoints include:

- `POST /calendar/:calendarId/events/:id/invitees` and `DELETE /calendar/:calendarId/events/:id/invitees/:inviteeId`
- `POST /calendar/:calendarId/events/:id/meeting`
- `GET /calendar/:calendarId/events/:id/meeting`
- `PATCH /calendar/:calendarId/events/:id/meeting`
- `POST /calendar/:calendarId/events/:id/meeting/token`
- `DELETE /calendar/:calendarId/events/:id`
