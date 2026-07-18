import React from 'react'
const Card = (prop) => {
  return (
    <div>
      <a href={prop.elm.url} key={prop.idx} target="_blank">
        <div key={prop.idx}>
          <div className="flex h-[82%] flex-wrap gap-4 p-2">
            <img
              className="h-40 w-40  object-cover rounded-xl"
              src={prop.elm.download_url}
              alt="photos"
            />
          </div>
          <h2 className="font-bold">{prop.elm.author}</h2>
        </div>
      </a>
    </div>
  );
};
export default Card;


