export type GameState = 'INTRO' | 'TUNING' | 'LISTENING' | 'INTERRUPTION' | 'ACTION' | 'SUCCESS' | 'FAIL';

export interface AudioConfig {
  apiKey: string;
  modelId: string;
}
