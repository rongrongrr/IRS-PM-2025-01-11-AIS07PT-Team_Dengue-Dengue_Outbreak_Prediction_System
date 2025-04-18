export default function Header({ dataTimeStamp }) {
  return (
    <div className="bg-blue-800 text-white px-6 py-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">
          Dengue Outbreak Prediction System
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm bg-blue-500 px-3 py-1 rounded">
            Last updated: {dataTimeStamp}
          </span>
        </div>
      </div>
    </div>
  );
}
