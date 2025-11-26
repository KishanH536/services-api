export const defaultSceneChangeConfiguration = {
  firstCheckFrom: '08:00',
  firstCheckTo: '20:00',
  secondCheckFrom: '20:00',
  secondCheckTo: '08:00',
  tamperingVMS: false,
  automaticRefreshReferenceConfig: {
    emails: [],
    notify: false,
    enabled: false,
    notifyOn: 1,
    frequency: '1W',
    useIdleDetectionEmail: false,
  },
}
