// @flow
import React from 'react'
import ViewWrapper, { type CommonViewProps } from '../ViewWrapper'
import { type MapViewContentProps } from '../MapView/MapViewContent'
import ReportViewContent from './ReportViewContent'

type Props = {
  ...$Exact<CommonViewProps>,
  mapStyle: $PropertyType<MapViewContentProps, 'mapStyle'>,
  mapboxAccessToken: $PropertyType<MapViewContentProps, 'mapboxAccessToken'>,
  initialPageNumber?: number
}

const ReportView = ({
  observations,
  onUpdateObservation,
  onDeleteObservation,
  presets,
  filter,
  getMediaUrl,
  ...otherProps
}: Props) => {
  return (
    <ViewWrapper
      observations={observations}
      onUpdateObservation={onUpdateObservation}
      onDeleteObservation={onDeleteObservation}
      presets={presets}
      filter={filter}
      getMediaUrl={getMediaUrl}
    >
      {({ onClickObservation, filteredObservations, getPreset, getMedia }) => (
        <ReportViewContent
          onClick={onClickObservation}
          observations={filteredObservations}
          getPreset={getPreset}
          getMedia={getMedia}
          {...otherProps}
        />
      )}
    </ViewWrapper>
  )
}

export default ReportView
