import React from "react";
import { Composition } from "remotion";
import { MeetBookVideo, TOTAL_FRAMES } from "./Video";

export const RemotionRoot = () => (
  <Composition id="MeetBook" component={MeetBookVideo} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
);
