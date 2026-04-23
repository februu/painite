import postgres from 'postgres';
import { env } from '$env/dynamic/private';

const sql = postgres(`postgresql://${env.POSTGRES_USER}:${env.POSTGRES_PASSWORD}@${env.POSTGRES_HOST}:${env.POSTGRES_PORT}/${env.POSTGRES_DB}`);

export default sql;