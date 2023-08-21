export interface FtechUser {
    address: string;
    twitterUsername: string;
    twitterName: string;
    twitterPfpUrl: string;
    twitterUserId: string;
}

export interface FtechResponse {
    users: FtechUser[];
}
