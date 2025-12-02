interface AuthConfig {
    appId: string;
    keystoneUrl: string;
    sessionId?: string;
    appSecret?: string;
}

interface SessionData {
    sessionId: string;
    userAppAccessId: string;
    app: App;
    user: User;
    tenant: Tenant;
    createdAt: string;
}

export interface Tenant {
    id: string;
    name: string;
    logo?: string | null;
    color?: string | null;
    description?: string | null;
    colorContrast?: string | null;
    parentTenantId?: string | null;
  }
  
  export interface User {
    id: string;
    username?: string;
    name?: string;
    email?: string;
    role?: string;
    groups?: string[];
    tenant?: Tenant;
  }
  
  export interface App {
    id: string;
    secret?: string;
    logo?: string | null;
    description?: string | null;
    name?: string;
    tenantId?: string;
    allowedURLs?: string[];
    mainUrl?: string;
  }

export async function VerifySession({
    appId,
    keystoneUrl,
    sessionId,
    appSecret
}: AuthConfig & { sessionId: string; appSecret: string }): Promise<SessionData> {
    const headers = new Headers();
    headers.set("Authorization", `Bearer ${appSecret}`);
    headers.set("x-app-id", appId);
    
    try {
        const response = await fetch(
            `${keystoneUrl}/app/verifysession?sessionId=${encodeURIComponent(sessionId)}`,
            {
                method: "POST",
                credentials: "include",
                redirect: "manual",
                headers,
            }
        );

        const data = await response.json();

        if (data.error) {
            throw new Error(data.error);
        }

        return {
            sessionId: data.id,
            userAppAccessId: data.userAppAccessId,
            createdAt: data.createdAt,
            app: data.userAppAccess.app,
            user: data.userAppAccess.user,
            tenant: data.userAppAccess.user.tenant,
        };
    } catch (error) {
        throw error; // Re-throw to allow the caller to handle the error
    }
}