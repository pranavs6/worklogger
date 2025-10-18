export default function LoadingSpinner() {
  return (
    <div className="govuk-grid">
      <div className="govuk-grid-column-full">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gov-blue"></div>
          <span className="ml-4 text-gov-grey-dark">Loading...</span>
        </div>
      </div>
    </div>
  )
}
